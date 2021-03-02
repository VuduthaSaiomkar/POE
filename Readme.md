
peer lifecycle chaincode package poe.tar.gz --path github.com/chaincode/  --lang golang  --label poe_1.0

peer lifecycle chaincode install poe.tar.gz

peer lifecycle chaincode approveformyorg -o orderer.example.com:7050  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem --channelID demochannel --name poe --version 1.0  --init-required --package-id poe_1.0:e2a3f62005c91c61f6ed9f8d7555ec4d3c50a999b49088a97a08272991242fc6 --sequence 1

peer lifecycle chaincode commit -o orderer.example.com:7050  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem  --channelID demochannel --name poe  --version 1.0 --sequence 1 --init-required

