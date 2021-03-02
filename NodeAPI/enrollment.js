'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const ccpPath = path.resolve(__dirname, 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);
const defaultsPath = path.resolve(__dirname, 'defaults.json');
const defaultsJSON = fs.readFileSync(defaultsPath, 'utf8');
const defaults = JSON.parse(defaultsJSON);
let Org = defaults["Organisation"]
const caInfo = ccp.certificateAuthorities['ca_org1'];
console.log(caInfo)
const caTLSCACerts = caInfo.tlsCACerts.pem;
const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName)
const walletPath = path.join(process.cwd(), 'wallet');
var adminIdentity;





async function enrolluser(username, secert) {
    try {
        const wallet = await  Wallets.newFileSystemWallet(walletPath);
        const userExists = await wallet.get(username);
                if (userExists) {
                    console.log('An identity for the ' + username + ' already exists in the wallet');
                    return { "success": true, "message": "Login success" }
                }else{
                    return {success:false,"message":"please register use first"}
                }
                } catch (err) {
        return { "success": false, "message": `error connecting to network ${err}` }
    }
}

async function registeruser(username,secret,org) {
    try {
        console.log("entered into register user")
        const wallet = await  Wallets.newFileSystemWallet(walletPath);
        var adminExists = await wallet.get('admin');
        if (adminExists) {
            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity:'admin', discovery: { enabled: false } });
            const adminIdentity = gateway.getCurrentIdentity();           
           // const network = await gateway.getNetwork('pharmtrack');
           // const contract = network.getContract('pharmtrack');
              try {
                await ca.register({ enrollmentID: username, enrollmentSecret: secret, role: 'client', attrs: [{ name: "OrganizationID", value: org, ecert: true }], maxEnrollments: -1 }, adminIdentity);
                const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret, attr_reqs: [{ name: "OrganizationID", optional: true }] });
                const userIdentity = X509WalletMixin.createIdentity('org1MSP', enrollment.certificate, enrollment.key.toBytes());
                wallet.import(username, userIdentity);
            } catch (err) {
                return { "success": false, "message": `user is not able to registered into the network,error:${err}` }
            }
            await gateway.disconnect();
            return { "success": true, "message": `successfully registered user ${username}` }
        } else {
            return { "success": false, "message": `not able to register admin into network ${err}` }
        }
    } catch (error) {
        console.error(`Failed to register user ${username}: ${error}`);
    }
}

async function enrolladmin() {
    try {
        const wallet = await  Wallets.newFileSystemWallet(walletPath);
        const adminExists = await wallet.get('admin');
        if (adminExists) {
            return { "success": true, "message": `Already Admin exists` }
        }
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('admin', x509Identity);
        return { "success": true, "message": `successfully registered Admin` }
    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
        return { "success": false, "message": `Failed to enroll admin user "admin": ${error}` }
    }
}




exports.enrolluser = enrolluser;
exports.registeruser = registeruser;
exports.enrolladmin = enrolladmin;
