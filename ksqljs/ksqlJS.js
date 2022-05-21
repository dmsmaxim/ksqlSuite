const axios = require("axios");
const http2 = require("http2");
const queryBuilder = require('./queryBuilder')

class ksqljs {
  constructor(config) {
    this.ksqldbURL = config.ksqldbURL;
    this.API = config.API ? config.API : null;
    this.secret = config.secret ? config.secret : null;
  }

  //---------------------Pull queries (fetch a single batch of existing rows)-----------------
  pull = (query) => {
    return axios
      .post(this.ksqldbURL + "/query-stream",
        {
          sql: query,
        },
        {
          // headers: {
          //   Authorization: `Basic ${Buffer.from(this.API + ":" + this.secret, 'utf8').toString('base64')}`
          // }
        })
      .then((res) => res.data)
      .catch((error) => { throw error });
  }

  //---------------------Push queries (continue to receive updates to stream)-----------------
  push = (query, cb) => {
    return new Promise((resolve, reject) => {
      const session = http2.connect(this.ksqldbURL);
      let dataRes = [];

      session.on("error", (err) => reject(err));

      const req = session.request({
        ":path": "/query-stream",
        ":method": "POST",
      });

      const reqBody = {
        sql: query,
        Accept: "application/json"
      }

      req.write(JSON.stringify(reqBody), "utf8");
      req.end();
      req.setEncoding("utf8");

      req.on("data", (data) => {
        dataRes.push(data);
      })
      req.on("end", () => {
        resolve(dataRes);
        session.close()
      });
    })
  }

  push(query, cb) {
    return new Promise((resolve, reject) => {
      let sentQueryId = false;
      const session = http2.connect(this.ksqldbURL);

      session.on("error", (err) => reject(err));

      const req = session.request({
        ":path": "/query-stream",
        ":method": "POST",
      });

      const reqBody = {
        sql: query,
        Accept: "application/json, application/vnd.ksqlapi.delimited.v1",
      };

      req.write(JSON.stringify(reqBody), "utf8");
      req.end();
      req.setEncoding("utf8");

      req.on("data", (chunk) => {
        if (!sentQueryId) {
          sentQueryId = true;
          cb(chunk);
          resolve(JSON.parse(chunk)?.queryId)
        }
        else {
          cb(chunk);
        }
      });

      req.on("end", () => session.close());
    })
  }

  terminate(queryId) {
    return axios.post(this.ksqldbURL + '/ksql', { ksql: `TERMINATE ${queryId};` })
      .then(res => res.data[0])
      .catch(error => { return error });
    // return new Promise((resolve, reject) => {
    // const session = http2.connect(this.ksqldbURL);
    // session.on("error", (err) => console.error(err));

    // const req = session.request({
    //   ":path": "/close-query",
    //   ":method": "POST",
    // });

    // const reqBody = {
    //   queryId: queryId,
    //   Accept: "application/json, application/vnd.ksqlapi.delimited.v1",
    // };

    // req.write(JSON.stringify(reqBody), "utf8");
    // req.end();
    // req.setEncoding("utf8");

    // req.on("data", (response) => {
    //   console.log(response);
    //   resolve(response);
    // })

    // req.on("end", () => session.close());
    // })
  }

  ksql(query) {
    return axios.post(this.ksqldbURL + '/ksql', { ksql: query })
      .then(res => res.data[0])
      .catch(error => console.log(error));
  }

  createStream(name, columnsType, topic, value_format = 'json', partitions = 1, key) {
    console.log(this.ksqldbURL);
    if(typeof name !== 'string' || typeof columnsType !== 'object' || typeof topic !== 'string' || typeof partitions !== 'number'){
      return console.log("invalid input(s)")
    }
    const columnsTypeString = columnsType.reduce((result, currentType) => result + ', ' + currentType);
    const query = `CREATE STREAM ${name} (${columnsTypeString}) WITH (kafka_topic='${topic}', value_format='${value_format}', partitions=${partitions});`;

    return axios.post(this.ksqldbURL + '/ksql', { ksql: query })
    .then(res => res)
    .catch(error => console.log(error));
  }

  //---------------------Create tables-----------------
  createTable = (name, columnsType, topic, value_format = 'json', partitions = 1) => {
      let columnsTypeString = columnsType.reduce((result, currentType) => result + ', ' + currentType);
      
      // reformat for builder
      name = [name];
      columnsTypeString = [columnsTypeString];

      const builder = new queryBuilder();
      const query = builder.build('CREATE TABLE ? (?) WITH (kafka_topic=?, value_format=?, partitions=?);', name, columnsTypeString, topic, value_format, partitions)

      return axios.post(this.ksqldbURL + '/ksql', {ksql: query})
      .catch(error => console.log(error));
    }

  //---------------------Create tables as select-----------------
  createTableAs = (tableName, source, selectArray, propertiesObj, conditionsObj) => {
    let selectColStr = selectArray.reduce((result, current) => result + ', ' + current);

    // expect user to input properties object of format {topic: ... , value_format: ..., partitions: ...}
    // check for properties object, look for properties, if any are missing assign it a default value, if there's no property 
    const defaultProps = {
      topic: tableName,
      value_format: 'json',
      partitions: 1
    };
    if (propertiesObj){
        for (let key in defaultProps){
          if (!propertiesObj[key]){
            propertiesObj[key] = defaultProps[key];
          }
        }
      }
    else {
      const propertiesObj = {};
      for (let key in defaultProps){
        propertiesObj[key] = defaultProps[key];
      }
    }
    // if there's no properties Obj, assign them all default values

    // expect user to input a conditions object of format {WHERE: condition, GROUP_BY: condition, HAVING: condition};
    // generate conditions string based on object
    let conditionQuery = '';
    if (conditionsObj){
    const conditionsArr = ['WHERE', 'GROUP_BY', 'HAVING'];
    for (let i = 0; i < conditionsArr.length; i++){
      if (conditionsObj[conditionsArr[i]]){
        const sqlClause = conditionsArr[i].replace('_', ' ');
        conditionQuery = conditionQuery + `${sqlClause} ${conditionsObj[conditionsArr[i]]} `
      }
    }
  }

    // reformat for builder
    tableName = [tableName];
    selectColStr = [selectColStr];
    source = [source];
    conditionQuery = [conditionQuery]

    const builder = new queryBuilder();
    const query = builder.build(`CREATE TABLE ? WITH (kafka_topic=?, value_format=?, partitions=?) AS SELECT ? FROM ? ?EMIT CHANGES;`, tableName, propertiesObj.topic, propertiesObj.value_format, propertiesObj.partitions, selectColStr, source, conditionQuery)

    return axios.post(this.ksqldbURL + '/ksql', { ksql: query })
    .catch(error => console.log(error));
  }
  //---------------------Insert Rows Into Existing Streams-----------------
  insertStream = (stream, rows) => {
    return new Promise((resolve, reject) => {
      const msgOutput = [];

      const session = http2.connect(this.ksqldbURL);
      const req = session.request({
        ":path": "/inserts-stream",
        ":method": "POST",
      });
  
      let reqBody = `{ "target": "${stream}" }`;
  
      for (let row of rows) {
        reqBody += `\n${JSON.stringify(row)}`;
      }
  
      req.write(reqBody, "utf8");
      req.end();
      req.setEncoding("utf8");
  
      req.on("data", (chunk) => {
        msgOutput.push(JSON.parse(chunk));
      });
  
      req.on("end", () => {
        resolve(msgOutput);
        session.close();
      });
    })
  }

};

module.exports = ksqljs;