const ksqljs = require('./ksqljs/ksqlJS.js');
require('dotenv').config();
const util = require('util')

const client = new ksqljs({
    ksqldbURL: 'https://localhost:8088',
    httpsAgent: {
        rejectUnauthorized: false
    }
});

// const client = new ksqljs({ksqldbURL: 'https://0.0.0.0:8088'});
let metadata;

//---------------------Test PUll Queries-------------------
/* const pullTest = async () => {
    try {
        const result = await client.pull('SELECT * FROM riderlocations');
    } catch (error) {
        console.log(error);
    }

}

pullTest(); */

//---------------------Test Push Queries-------------------
/* const pushTest = async () => {
    try {
        metadata = await client.push('SELECT * FROM riderlocations EMIT CHANGES LIMIT 1;', (row) => console.log(row));
        console.log('this is the metadata returned ', metadata);
    } catch (error) {
        console.log(error);
    }

};

pushTest();

//---------------------Test Termination of Queries-------------------
const terminateTest = async () => {
    client.terminate(metadata);
};

setTimeout(() => terminateTest(metadata), 2000); */

//---------------------Test List Queries-------------------
// const listQueries = async () => {
//     console.log(await client.ksql('LIST QUERIES;'));
//     console.log(await client.ksql('LIST STREAMS;'));
//     console.log(await client.ksql('LIST TABLES;'));
//     console.log(await client.ksql('LIST TOPICS;'));
// }

// listQueries();

// ---------------------Test Stream Creation-------------------
// const createStreamTest = async () => {
//     await client.ksql('DROP STREAM IF EXISTS TestStream;');
//     await client.createStream('TestStream', ['name VARCHAR', 'email varchar', 'age INTEGER'], 'testTopic', 'json', 1);
//     const streams = await client.ksql('LIST STREAMS;');
//     console.log(streams);
// }

// createStreamTest();

//---------------------Test Table Creation-------------------
/* const createTableTest = () => {
    client.createTable('AnotherTestTable', ['name VARCHAR PRIMARY KEY', 'email VARCHAR', 'age INTEGER'], 'users', 'json', 1);
};

createTableTest(); */

//---------------------Test Insert Stream-------------------
// const insertStreamTest = async () => {
//     const test = await client.insertStream('TestStream', [
//         { "name": "matt", "email": "123@mail.com", "age": 1000 },
//         { "name": "jonathan", "email": "234@mail.com", "age": 99 }
//     ]);
//     console.log('returned array: ', test);
//     const result = await client.pull('SELECT * FROM TestStream;');
//     console.log('this is the result', result);
// };

// insertStreamTest();

