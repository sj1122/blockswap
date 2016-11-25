package main

import (
	"errors"
	"fmt"
	"strconv"
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	//"github.com/hyperledger/fabric/core/util"
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
	//fns := ChaincodeFunctions{stub}
	configJson := args[0]
	_ = args[1] // nonce to stop existing deal being returned
	_ = stub.PutState("dealConfig", []byte(configJson))
	_ = stub.PutState("dealStatus", []byte("draft")) // Possible Values [draft, open, closed, allocated]
	_ = stub.PutState("orderbook", []byte("{}"))
	return nil, nil
}

func (t Chaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Println("invoke is running " + function)
	fns := ChaincodeFunctions{stub}
	if function == "addOrder" {
		investor := args[0]
		ioi, err := strconv.ParseFloat(args[1], 64)
		if err != nil {
	        return nil, errors.New("Failed to parse " + args[1] + " as a float64")
    	}
		return fns.AddOrder(investor, ioi)
	} else if function == "allocateOrder" {
		investor := args[0]
		alloc, err := strconv.ParseFloat(args[1], 64)
		if err != nil {
	        return nil, errors.New("Failed to parse " + args[1] + " as a float64")
    	}
		return fns.AllocateOrder(investor, alloc)	
	} else if function == "updateDealStatus" {
		status := args[0]
		return fns.UpdateDealStatus(status)
	}
	fmt.Println("invoke did not find func: " + function)

	return nil, errors.New("Received unknown function invocation: " + function)
}

func (t Chaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Println("query is running " + function)
	fns := ChaincodeFunctions{stub}
	if function == "ping" {
		return fns.Ping()
	} else if function == "getDealConfig" {
		return fns.GetDealConfig()
	} else if function == "getOrder" {
		investor := args[0]
		return fns.GetOrder(investor)
	} else if function == "getOrderbook" {
		return fns.GetOrderbook()
	}
	fmt.Println("query did not find func: " + function)

	return nil, errors.New("Received unknown function query: " + function)
}

type DealConfig struct {
	Issuer 		string 		`json:"issuer"`
	Banks 		[]string 	`json:"banks"`
	BookStatus 	string 		`json:"bookStatus"`
	Price 		float64 	`json:"price"`
}

type Order struct {
	Investor	string 		`json:"investor"`
	Ioi 		float64 	`json:"ioi"`
	Alloc 		float64		`json:"alloc"`
}

// Public Functions

func (c ChaincodeFunctions) Ping() ([]byte, error) {
    return []byte("pong"), nil
}

/*func (c ChaincodeFunctions) GetRole() ([]byte, error) {
    role, err := c.stub.ReadCertAttribute("role")
    if err != nil { return nil, errors.New("Couldn't get attribute 'role'. Error: " + err.Error()) }
	return role, nil
}*/

func (c ChaincodeFunctions) GetDealConfig() ([]byte, error) {
	dealConfig, _ := c.stub.GetState("dealConfig")
	return dealConfig, nil
}

func (c ChaincodeFunctions) UpdateDealStatus(dealStatus string) ([]byte, error)  {
	dealConfig := c.getDealConfigFromBlockchain()
	dealConfig.BookStatus = dealStatus
	c.saveDealConfigToBlockchain(dealConfig)
	c.stub.SetEvent("Book Status Change", []byte("{\"status\":\"" + dealStatus + "\"}"))
	return nil, nil
}

func (c ChaincodeFunctions) AddOrder(investor string, ioi float64) ([]byte, error)  {
	dealConfig := c.getDealConfigFromBlockchain()
	if(dealConfig.BookStatus != "open") {
		c.stub.SetEvent("Permission Denied", []byte("{\"reason\":\"book is not open\"}"))
		return nil, errors.New("Orders cannot be placed unless deal status is 'Open'")
	}
	order := Order{Investor: investor, Ioi: ioi, Alloc: 0.0}
	c.saveOrderToBlockChain(order)
	c.stub.SetEvent("Order Added", []byte("{\"investor\":\"" + investor + "\"}"))
	return nil, nil
}

func (c ChaincodeFunctions) GetOrder(investor string) ([]byte, error) {
	orderJson := c.getOrderAsJsonFromBlockchain(investor)
	return []byte(orderJson), nil
}

func (c ChaincodeFunctions) GetOrderbook() ([]byte, error) {
	orderbookJson, _ := c.stub.GetState("orderbook")
	return []byte(orderbookJson), nil
}

func (c ChaincodeFunctions) AllocateOrder(investor string, alloc float64) ([]byte, error) {
	order := c.getOrderFromBlockChain(investor)
	order.Alloc = alloc
	c.saveOrderToBlockChain(order)
	c.stub.SetEvent("Order Allocated", []byte("{\"investor\":\"" + investor + "\"}"))
	return nil, nil
}

/*func (c ChaincodeFunctions) Echo(address string, f string, arg string) ([]byte, error) {
	invokeArgs := util.ToChaincodeArgs(f, arg)
	return c.stub.QueryChaincode(address, invokeArgs)
}*/

// Private Functions

func (c ChaincodeFunctions) getDealConfigFromBlockchain() DealConfig {
	dealConfigJson, _ := c.stub.GetState("dealConfig")
	var dealConfig DealConfig
	_ = json.Unmarshal(dealConfigJson, &dealConfig)
	return dealConfig
}

func (c ChaincodeFunctions) saveDealConfigToBlockchain(dealConfig DealConfig) {
	dealConfigJson, _ := json.Marshal(dealConfig)
	_ = c.stub.PutState("dealConfig", []byte(dealConfigJson))
}

func (c ChaincodeFunctions) getOrderAsJsonFromBlockchain(investor string) string {
	order := c.getOrderFromBlockChain(investor)
	orderJson, _ := json.Marshal(order)
	return string(orderJson)
}

func (c ChaincodeFunctions) getOrderFromBlockChain(investor string) Order {
	orderbook := c.getOrderbookFromBlockChain()
	return orderbook[investor]
}

func (c ChaincodeFunctions) saveOrderToBlockChain(order Order) {
	orderbook := c.getOrderbookFromBlockChain()
	orderbook[order.Investor] = order
	c.saveOrderbookToBlockChain(orderbook)
}

func (c ChaincodeFunctions) getOrderbookFromBlockChain() map[string]Order {
	orderbookJson, _ := c.stub.GetState("orderbook")
	var orderbook map[string]Order
	_ = json.Unmarshal(orderbookJson, &orderbook)
	return orderbook
}

func (c ChaincodeFunctions) saveOrderbookToBlockChain(orderbook map[string]Order) {
	orderbookJson, _ := json.Marshal(orderbook)
	_ = c.stub.PutState("orderbook", []byte(orderbookJson))
}