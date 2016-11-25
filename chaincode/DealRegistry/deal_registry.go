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
		issuer := args[1]
		return fns.RegisterDeal(deploymentId, issuer)
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
	Issuer 		string 		`json:"issuer"`
	Banks 		[]string 	`json:"banks"`
	BookStatus 	string 		`json:"bookStatus"`
	Price 		float64 	`json:"price"`
}

type Deal struct {
	DeploymentId 	string 	`json:"deploymentId"`
	Issuer			string 	`json:"issuer"`
}

// Public Functions

func (c ChaincodeFunctions) Ping() ([]byte, error) {
    return []byte("pong"), nil
}

func (c ChaincodeFunctions) RegisterDeal(deploymentId string, issuer string) ([]byte, error)  {
	deal := Deal{DeploymentId: deploymentId, Issuer: issuer}
	c.saveDealToBlockChain(deal)
	c.stub.SetEvent("New Deal Registered", []byte("{\"deploymentId\":\"" + deploymentId + "\"}"))
	return nil, nil
}

func (c ChaincodeFunctions) GetDeals() ([]byte, error) {
	company, _ := c.stub.ReadCertAttribute("company")
	deals := c.getDealsFromBlockchain()
	var ret []Deal // == nil
    for _, deal := range deals {
    	dealConfig := c.getDealConfig(deal.DeploymentId)
        if stringInSlice(string(company), dealConfig.Banks) {
        	ret = append(ret, deal)
        }
    }
    dealsJson, _ := json.Marshal(ret)
    return []byte(dealsJson), nil
}

// Private Functions

func (c ChaincodeFunctions) saveDealToBlockChain(deal Deal) {
	deals := c.getDealsFromBlockchain()
	deals = append(deals, deal)
	dealRegistryJson, _ := json.Marshal(deals)
	_ = c.stub.PutState("deals", []byte(dealRegistryJson))
}

func (c ChaincodeFunctions) getDealsFromBlockchain() []Deal {
	dealsJson, _ := c.stub.GetState("deals")
	var deals []Deal
	_ = json.Unmarshal(dealsJson, &deals)
	return deals
}

func (c ChaincodeFunctions) getDealConfig(address string) DealConfig {
	invokeArgs := util.ToChaincodeArgs("getDealConfig")
	dealConfigJson, _ := c.stub.QueryChaincode(address, invokeArgs)
	var dealConfig DealConfig
	_ = json.Unmarshal(dealConfigJson, &dealConfig)
	return dealConfig
}

func stringInSlice(a string, list []string) bool {
    for _, b := range list {
        if b == a {
            return true
        }
    }
    return false
}