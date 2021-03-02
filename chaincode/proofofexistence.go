package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	pb "github.com/hyperledger/fabric-protos-go/peer"
)

//ProofOFExt is smartcontract name
type ProofOFExt struct {
}

//FileLog is structer to store file information
type FileLog struct {
	Filehash  string `json:"filehash"`
	MetaData  string `json:"metadata"`
	TimeStamp string `json:"timestamp"`
}

// ===================================================================================
// Main
// ===================================================================================
func main() {
	err := shim.Start(new(ProofOFExt))
	if err != nil {
		fmt.Printf("Error starting ProofOFExt chaincode: %s", err)
	}
}

// Init initializes chaincode
// ===========================
func (t *ProofOFExt) Init(stub shim.ChaincodeStubInterface) pb.Response {
	return shim.Success(nil)
}

// Invoke - Our entry point for Invocations
// ========================================
func (t *ProofOFExt) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	function, args := stub.GetFunctionAndParameters()
	fmt.Println("invoke is running " + function)

	if function == "fnaddfile" {
		return t.fnaddfile(stub, args)
	} else if function == "fngetfilebyhash" {
		return t.fngetfilebyhash(stub, args)
	} else if function == "fngetallfiles" {
		return t.fngetallfiles(stub, args)
	}
	return shim.Error("recevied unknown function name :" + function)
}

//to add file into the network
func (t *ProofOFExt) fnaddfile(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}
	var filelog FileLog
	err := json.Unmarshal([]byte(args[0]), &filelog)
	filelog.TimeStamp = strconv.FormatInt(fnGetTimsstampinSec(stub), 10)
	filelogBytes, _ := json.Marshal(filelog)
	err = stub.PutState(filelog.Filehash, filelogBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

/*
	getting timestamp for all transaction
*/

func fnGetTimsstampinSec(stub shim.ChaincodeStubInterface) int64 {

	sec, _ := stub.GetTxTimestamp()
	return sec.GetSeconds()
}

/*
	to get the file based on given hash
*/

func (t *ProofOFExt) fngetfilebyhash(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting filehash")
	}
	fileasbytes, err := stub.GetState(args[0])
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get file form proof of existen " + args[0] + "\"}"
		return shim.Error(jsonResp)
	} else if fileasbytes == nil {
		jsonResp := "{\"Error\":\"file with specific hash does not exist: " + args[0] + "\"}"
		return shim.Error(jsonResp)
	}
	return shim.Success(fileasbytes)
}

/*
	to get for all files from filelog
*/

func (t *ProofOFExt) fngetallfiles(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}
	resultsIterator, err := stub.GetQueryResult(args[0])
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()
	buffer, err := constructQueryResponseFromIterator(resultsIterator)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(buffer.Bytes())
}

func constructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) (*bytes.Buffer, error) {
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	return &buffer, nil
}
