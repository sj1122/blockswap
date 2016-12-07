package main

import (
	"errors"
	"fmt"
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/core/util"
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
	if function == "registerDeal" {
		deploymentId := args[0]
		return fns.RegisterDeal(deploymentId)
	}
	return nil, errors.New("Received unknown function invocation: " + function)
}

func (t Chaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Println("query is running " + function)
	fns := ChaincodeFunctions{stub}
	if function == "ping" {
		return fns.Ping()
	} else if function == "getDeals" {
		return fns.GetDeals()
	}
	return nil, errors.New("Received unknown function query: " + function)
}

type DealConfig struct {
	DeploymentId 	string 		`json:"deploymentId"`
	Issuer 			string 		`json:"issuer"`
	Banks 			[]string 	`json:"banks"`
	BookStatus 		string 		`json:"bookStatus"`
	Price 			float64 	`json:"price"`
	RequiredDocs	[]string	`json:"requiredDocs"`
}

// Public Functions

func (c ChaincodeFunctions) Ping() ([]byte, error) {
    return []byte("pong"), nil
}

func (c ChaincodeFunctions) RegisterDeal(deploymentId string) ([]byte, error)  {
	c.saveDealToBlockChain(deploymentId)
	c.stub.SetEvent("New Deal Registered", []byte("{\"deploymentId\":\"" + deploymentId + "\"}"))
	return nil, nil
}

func (c ChaincodeFunctions) GetDeals() ([]byte, error) {
	companyBytes, _ := c.stub.ReadCertAttribute("company")
	roleBytes, _ := c.stub.ReadCertAttribute("role")
	company := string(companyBytes)
	role := string(roleBytes)
	deals := c.getDealsFromBlockchain()
	ret := make([]DealConfig, 0)
    for _, deal := range deals {
    	dealConfig := c.getDealConfig(deal)
        if permissionedForDeal(role, company, dealConfig) {
        	ret = append(ret, dealConfig)
        }
    }
    dealsJson, _ := json.Marshal(ret)
    return []byte(dealsJson), nil
}

// Private Functions

func (c ChaincodeFunctions) saveDealToBlockChain(deploymentId string) {
	deals := c.getDealsFromBlockchain()
	deals = append(deals, deploymentId)
	dealRegistryJson, _ := json.Marshal(deals)
	_ = c.stub.PutState("deals", []byte(dealRegistryJson))
}

func (c ChaincodeFunctions) getDealsFromBlockchain() []string {
	dealsJson, _ := c.stub.GetState("deals")
	var deals []string
	_ = json.Unmarshal(dealsJson, &deals)
	return deals
}

func (c ChaincodeFunctions) getDealConfig(address string) DealConfig {
	invokeArgs := util.ToChaincodeArgs("getDealConfig")
	dealConfigJson, _ := c.stub.QueryChaincode(address, invokeArgs)
	var dealConfig DealConfig
	_ = json.Unmarshal(dealConfigJson, &dealConfig)
	dealConfig.DeploymentId = address
	return dealConfig
}

func permissionedForDeal(role string, company string, dealConfig DealConfig) bool {
	if company == dealConfig.Issuer { 
		return true 
	} else if role == "bank" && stringInSlice(company, dealConfig.Banks) { 
		return true
	} else if role == "investor" && dealConfig.BookStatus != "draft" { 
		return true 
	} else if role == "regulator" {
		return true
	} else if role == "clearing_house" && dealConfig.BookStatus == "confirmed" {
		return true
	} else {
		return false
	}
}

func stringInSlice(a string, list []string) bool {
    for _, b := range list {
        if b == a {
            return true
        }
    }
    return false
}