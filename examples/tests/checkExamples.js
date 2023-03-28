'use strict';

require('dotenv').config();

const { start, deploy, executeEVMExample, executeAptosExample, getWallet, getEVMChains, executeNearExample } = require('../../scripts/libs');
const {
    destroyExported,
    utils: { setLogger },
} = require('@axelar-network/axelar-local-dev');
const fs = require('fs-extra');
const path = require('path');

const dir = path.resolve(__dirname, '..', '..');
const infoPath = path.join(dir, 'chain-config/local.json');

// disable logging
setLogger((...args) => {});

console.log = () => {};

const examples = [
    'call-contract',
    'call-contract-with-token',
    'call-contract-with-token-express',
    'cross-chain-token',
    'deposit-address',
    'nonced-execution',
    'send-ack',
    'send-token',
    // 'nft-linker',
    // 'nft-auctionhouse',
];

const aptosExamples = ['call-contract', 'token-linker'];

const nearExamples = ['call-contract'];

// These examples fork the mainnet, so they take a long time to run.
const forkExamples = [
    // 'cross-chain-lending', // cross-chain lending uses forecall which is deprecated, so ignore this example until migrating to GMP Express.
];

describe('Check Examples Execution', function () {
    // marked as slow if it takes longer than 15 seconds to run each test.
    const wallet = getWallet();
    const testChains = ['Avalanche', 'Fantom', 'Polygon'];

    beforeEach(async () => {
        // Remove local.json before each test to ensure a clean start
        if (fs.existsSync(infoPath)) {
            fs.unlinkSync(infoPath);
        }

        await start([wallet.address], testChains, { relayInterval: 500 });
    });

    afterEach(async () => {
        await destroyExported();
    });

    describe('NEAR Examples', function () {
        for (const exampleName of nearExamples) {
            it(exampleName, async function () {
                const example = rootRequire(`examples/near/${exampleName}/index.js`);
                const chains = getEVMChains('local', testChains);

                if (example.deploy) await deploy('local', chains, wallet, example);

                await executeNearExample(chains, [], wallet, example);
            });
        }
    });

    describe('EVM Examples', function () {
        const allExamples = [...examples, ...forkExamples];

        for (const exampleName of allExamples) {
            it(exampleName, async function () {
                const example = rootRequire(`examples/evm/${exampleName}/index.js`);
                const chains = getEVMChains('local', testChains);

                if (example.deploy) {
                    await deploy('local', chains, wallet, example);
                }

                await executeEVMExample('local', chains, [], wallet, example);
            });
        }
    });

    describe('Aptos Examples', function () {
        for (const exampleName of aptosExamples) {
            it(exampleName, async function () {
                const example = rootRequire(`examples/aptos/${exampleName}/index.js`);
                const chains = getEVMChains('local', testChains);

                if (example.deploy) await deploy('local', chains, wallet, example);

                await executeAptosExample(chains, [], wallet, example);
            });
        }
    });
});
