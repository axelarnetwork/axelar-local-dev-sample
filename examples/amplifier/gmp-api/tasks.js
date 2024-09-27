const fs = require('fs');
const axios = require('axios');
const https = require('https');
const ethers = require('ethers');
const { getConfig, getChainConfig } = require('../config.js');
require('dotenv').config();

const { gmpAPIURL, cert, key } = getConfig();
var dryRun = true;

async function pollTasks({ chainName, pollInterval, dryRunOpt, approveCb, executeCb }) {
    if (dryRunOpt) {
        console.log('Dry run enabled');
        dryRun = true;
    }

    const chainConfig = getChainConfig(chainName);

    setInterval(() => {
        getNewTasks(chainConfig, approveCb, executeCb);
    }, pollInterval);
}

async function getNewTasks(chainConfig, approveCb, executeCb) {
    latestTask = loadLatestTask(chainConfig.name);

    var urlSuffix = '';

    if (latestTask !== '') {
        urlSuffix = `?after=${latestTask}`;
    }

    const url = `${gmpAPIURL}/chains/${chainConfig.name}/tasks${urlSuffix}`;

    console.log('Polling tasks:', url);

    try {
        const response = await axios({
            method: 'get',
            url,
            httpsAgent: new https.Agent({
                cert,
                key,
                rejectUnauthorized: false,
            }),
        });

        const tasks = response.data.tasks;

        if (tasks.length === 0) {
            console.log('No new tasks');
            return;
        }

        console.log('Tasks:', tasks);

        for (const task of tasks) {
            console.log('Processing task:', task.id);

            var payload;
            var destinationAddress;
            var cb;

            if (task.type === 'GATEWAY_TX') {
                console.log('found approve task');
                payload = decodePayload(task.task.executeData);
                destinationAddress = chainConfig.gateway;
                cb = approveCb;
            } else if (task.type === 'EXECUTE') {
                console.log('found execute task');
                payload = decodePayload(task.task.payload);
                destinationAddress = task.task.message.destinationAddress;
                cb = executeCb;
            } else {
                console.warn('Unknown task type:', task.type);
                continue;
            }

            await relayToChain(chainConfig.rpc, payload, destinationAddress, cb);

            console.log('Task processed:', task.id);
            saveLatestTask(chainConfig.name, task.id);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

function saveLatestTask(chainName, latestTask) {
    fs.writeFileSync(`./latestTask-${chainName}.json`, JSON.stringify(latestTask));
}

function loadLatestTask(chainName) {
    try {
        return fs.readFileSync(`./latestTask-${chainName}.json`, 'utf8');
    } catch (error) {
        return '';
    }
}

async function relayToChain(rpc, payload, destinationAddress, cb) {
    if (dryRun) {
        console.log('Destination:', destinationAddress, 'Payload:', payload);
        return;
    }

    const provider = new ethers.providers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, provider);

    console.log('Relaying payload:', payload);
    const tx = await wallet.sendTransaction({
        to: destinationAddress,
        data: payload,
    });

    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();

    console.log('Transaction confirmed');
    cb();
}

function decodePayload(executeData) {
    const buffer = Buffer.from(executeData, 'base64');
    return '0x' + buffer.toString('hex');
}

module.exports = {
    pollTasks,
};
