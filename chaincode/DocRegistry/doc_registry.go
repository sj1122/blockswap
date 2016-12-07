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
	_ = stub.PutState("_companies", []byte("[]"))
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
	} else if function == "getDocsForAllCompanies" {
		return fns.GetDocsForAllCompanies()
	}
	return nil, errors.New("Received unknown function query: " + function)
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
	myCompanyBytes, _ := c.stub.ReadCertAttribute("company")
	roleBytes, _ := c.stub.ReadCertAttribute("role")
	myCompany := string(myCompanyBytes)
	role := string(roleBytes)
	if myCompany != company && role != "regulator" && role != "bank" {
		return nil, errors.New("Not Permitted")
	}
	docs := c.getDocsFromBlockChain(company)
	docsJson, _ := json.Marshal(docs)
	return docsJson, nil
}

func (c ChaincodeFunctions) GetDocsForAllCompanies() ([]byte, error) {
	roleBytes, _ := c.stub.ReadCertAttribute("role")
	role := string(roleBytes)
	if role != "regulator" && role != "bank" {
		return nil, errors.New("Not Permitted")
	}
	allDocs := make(map[string][]string)
	companiesJson, _ := c.stub.GetState("_companies")
	var companies []string
	_ = json.Unmarshal(companiesJson, &companies)
	for _, company := range companies {
		docs := c.getDocsFromBlockChain(company)
		allDocs[company] = docs
	}
	allDocsJson, _ := json.Marshal(allDocs)
	return allDocsJson, nil
}

// Private Functions

func (c ChaincodeFunctions) getDocsFromBlockChain(company string) []string {
	docsJson, _ := c.stub.GetState(company)
	if docsJson == nil {
		return make([]string, 0)
	}
	var docs []string
	_ = json.Unmarshal(docsJson, &docs)
	return docs
}

func (c ChaincodeFunctions) saveDocsToBlockChain(company string, docs []string) {
	companiesJson, _ := c.stub.GetState("_companies")
	var companies []string
	_ = json.Unmarshal(companiesJson, &companies)
	companies = append(companies, company)
	companiesJson, _ = json.Marshal(companies)
	_ = c.stub.PutState("_companies", []byte(companiesJson))
	docsJson, _ := json.Marshal(docs)
	_ = c.stub.PutState(company, []byte(docsJson))
}