package main

import (
	"errors"
	"fmt"
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
)

type Chaincode struct { }

type ChaincodeFunctions struct {
	stub shim.ChaincodeStubInterface
}

func main() {
	err := shim.Start(new(Chaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

func (t Chaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	_ = stub.PutState("deals", []byte("[]"))
	return nil, nil
}

func (t Chaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Println("invoke is running " + function)
	fns := ChaincodeFunctions{stub}
	if function == "declareDoc" {
		docType := args[0]
		return fns.DeclareDoc(docType)
	}
	return nil, errors.New("Received unknown function invocation: " + function)
}

func (t Chaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Println("query is running " + function)
	fns := ChaincodeFunctions{stub}
	if function == "ping" {
		return fns.Ping()
	} else if function == "getDocs" {
		company := args[0]
		return fns.GetDocsFor(company)
	}
	return nil, errors.New("Received unknown function query: " + function)
}

type DealConfig struct {
	Docs []string  `json:"docs"`
}

// Public Functions

func (c ChaincodeFunctions) Ping() ([]byte, error) {
    return []byte("pong"), nil
}

func (c ChaincodeFunctions) DeclareDoc(docType string) ([]byte, error)  {
	companyBytes, _ := c.stub.ReadCertAttribute("company")
	company := string(companyBytes)
	docs := c.getDocsFromBlockChain(company)
	docs = append(docs, docType)
	c.saveDocsToBlockChain(company, docs)
	c.stub.SetEvent("New Doc Registered", []byte("{\"docType\":\"" + docType + "\"}"))
	return nil, nil
}

func (c ChaincodeFunctions) GetDocsFor(company string) ([]byte, error) {
	docs := c.getDocsFromBlockChain(company)
	docsJson, _ := json.Marshal(docs)
	return docsJson, nil
}

// Private Functions

func (c ChaincodeFunctions) getDocsFromBlockChain(company string) []string {
	docsJson, _ := c.stub.GetState(company)
	var docs []string
	_ = json.Unmarshal(docsJson, &docs)
	return docs
}

func (c ChaincodeFunctions) saveDocsToBlockChain(company string, docs []string) {
	docsJson, _ := json.Marshal(docs)
	_ = c.stub.PutState(company, []byte(docsJson))
}