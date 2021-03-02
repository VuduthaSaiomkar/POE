'use strict';

const { Wallets, Gateway } = require('fabric-network');
let enroll = require("./enrollment.js")
var query = require('./query.js')
const fs = require('fs');
const path = require('path');
const request = require('request');
const defaultsPath = path.resolve(__dirname, 'connection.json');
const defaultsJSON = fs.readFileSync(defaultsPath, 'utf8');
const defaults = JSON.parse(defaultsJSON);

const ccpPath = path.resolve(__dirname, 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp =  JSON.parse(ccpJSON);
const walletPath = path.join(process.cwd(), 'wallet');

async function fndoesUserExists(_user) {
    console.log('step-1')
    const wallet = await  Wallets.newFileSystemWallet(walletPath);
    let userExists = await wallet.get(_user);
    if (userExists) {
        return true;
    } else {
        return false
    }
}

async function submitInvoke(user, _fcn, _args) {

    console.info("invoking With admin : ", user)
    console.log(await fndoesUserExists(user))
    if (await fndoesUserExists(user)) {
        console.log(user)
        const wallet = await  Wallets.newFileSystemWallet(walletPath);
        const gateway = new Gateway();
        try {
            // Create a new gateway for connecting to our peer node.
            await gateway.connect(ccp, { wallet, identity: user, discovery: { enabled: false, asLocalhost: false} });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork('demochannel');
            // Get the contract from the network.
            const contract = network.getContract('poe');
            
            let result = await contract.submitTransaction(_fcn, _args)
           // console.log("result tx id:", result.toString())
            //console.log('Transaction has been submitted');
            await gateway.disconnect();
            //return { success: true, message: "Transaction successfully sumbmitted. " + result.toString() }
            return result.toString();
            } catch (error) {
            await gateway.disconnect();
            return { success: false, message: `Failed to submit transaction: ${error}` }
        }

    }
    return { success: false, message: `Failed to submit transaction` }
}




exports.submitInvoke = submitInvoke
