const axios = require("axios");
const http2 = require("http2");

class ksqljs {
  constructor(ksqldbURL) {
    this.ksqldbURL = ksqldbURL;
  }

  pull(query) {
    // return axios
    //   .post(this.ksqldbURL + "/query-stream", {
    //     sql: query,
    //   })
    //   .then((res) => res.data)
    //   .catch((error) => console.log(error));
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
    if(typeof name !== 'string' || typeof columnsType !== 'object' || typeof topic !== 'string' || typeof partitions !== 'number'){
      return console.log("invalid input(s)")
    }
    const columnsTypeString = columnsType.reduce((result, currentType) => result + ', ' + currentType);
    const query = `CREATE STREAM ${name} (${columnsTypeString}) WITH (kafka_topic='${topic}', value_format='${value_format}', partitions=${partitions});`;

    return axios.post(this.ksqldbURL + '/ksql', { ksql: query })
      .catch(error => console.log(error));
  }

  //---------------------Insert row into a stream-----------------
  /* @stream - target stream to insert into
     @rows - rows of data to insert, e.g. [
      { "name": "a", "email": "123@mail.com", "age": 25 },
      { "name": "b", "email": "234@mail.com", "age": 43 }
  ]
  */
  insertStream = (stream, rows) => {
    return new Promise((resolve, reject) => {
      let msgOutput = [];

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
        session.close();
        resolve(msgOutput);
        // console.log(msgOutput);
      });


    })
  }

};

module.exports = ksqljs;