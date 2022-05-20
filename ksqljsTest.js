const ksqljs = require('./ksqljs/ksqlJS');
require('dotenv').config();

// const client = new ksqljs({
//     ksqldbURL: 'https://pksqlc-755v2.us-east-2.aws.confluent.cloud:443',
//     API: process.env.KSQL_API_KEY,
//     secret: process.env.KSQL_API_SECRET
// });

const client = new ksqljs({ ksqldbURL: 'http://localhost:8088' })
let metadata;

//---------------------Test PUll Queries-------------------
/* const pullTest = async () => {
    const result = await client.pull('SELECT * FROM riderlocations;');
    console.log('this is the result', result);
}

pullTest();

//---------------------Test Push Queries-------------------
const pushTest = async () => {
    // metadata = await client.push('SELECT * FROM riderlocations EMIT CHANGES LIMIT 1;', (row) => console.log(row));
    // console.log('this is the metadata returned ', metadata);
    let pushActive = false;
    await client.createStream('TESTJESTSTREAM', ['age INTEGER'], 'testJestTopic', 'json', 1);
    // await client.push('SELECT * FROM TESTJESTSTREAM EMIT CHANGES LIMIT 1;', (data) => {
    //   console.log(data);
    //   console.log('HERE IS DATA ', JSON.parse(data).queryId)
    //   if(JSON.parse(data).queryId){
    //     pushActive = true;
    //   }
    //   client.ksql(`TERMINATE ${JSON.parse(data).queryId};`)
    //   client.ksql('DROP STREAM IF EXISTS TESTJESTSTREAM DELETE TOPIC;');
    // });
    // await client.ksql('DROP STREAM IF EXISTS TESTJESTSTREAM DELETE TOPIC;');

    /* const pushTest = async () => {
    try {
        metadata = await client.push('SELECT * FROM riderlocations EMIT CHANGES LIMIT 1;', (row) => console.log(row));
        console.log('this is the metadata returned ', metadata);
    } catch (error) {
        console.log(error);
    }

    metadata = await client.push('SELECT * FROM riderlocations EMIT CHANGES LIMIT 1;', (row) => console.log(row));
    console.log('this is the metadata returned ', metadata);

    metadata = await client.push('SELECT * FROM riderlocations EMIT CHANGES LIMIT 1;', (row) => console.log(row));
    console.log('this is the metadata returned ', metadata);
};

pushTest();

//---------------------Test Termination of Queries-------------------
/* const terminateTest = async () => {
    client.terminate(metadata);
};

setTimeout(() => terminateTest(metadata), 2000); */

//---------------------Test List Queries-------------------
/* const listQueries = async () => {
    console.log(await client.ksql('LIST QUERIES;'));
    console.log(await client.ksql('LIST STREAMS;'));
    console.log(await client.ksql('LIST TABLES;'));
    console.log(await client.ksql('LIST TOPICS;'));
}

listQueries(); */

//---------------------Test Stream Creation-------------------
const createStreamTest = () => {
    client.createStream('TestStream', ['name VARCHAR', 'email varchar', 'age INTEGER'], 'testTopic', 'json', 1);
}

// createStreamTest();

//---------------------Test Table Creation-------------------
/* const createTableTest = () => {
    client.createTable('AnotherTestTable', ['name VARCHAR PRIMARY KEY', 'email VARCHAR', 'age INTEGER'], 'users', 'json', 1);
};

createTableTest(); */

//---------------------Test Insert Stream-------------------
/* const insertStreamTest = () => {
    client.insertStream('TestStream', [
        { "name": "matt", "email": "123@mail.com", "age": 1000 },
        { "name": "jonathan", "email": "234@mail.com", "age": 99 }
    ]);
/* const insertStreamTest = async () => {
    const test = await client.insertStream('TestStream', [
        { "name": "matt", "email": "123@mail.com", "age": 1000 },
        { "name": "jonathan", "email": "234@mail.com", "age": 99 }
    ]);
    console.log('returned array: ', test);
*/

const insertStreamTest = async () => {
    const test = await client.insertStream('TestStream', [
        { "name": "matt", "email": "123@mail.com", "age": 1000 },
        { "name": "jonathan", "email": "234@mail.com", "age": 99 }
    ]);
    // console.log('returned array: ', test);
};

insertStreamTest();
