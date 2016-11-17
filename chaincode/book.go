package main

import (
	"errors"
	"fmt"
	"strconv"
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

// Init resets all the things
func (t Chaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	if len(args) > 0 {
		return nil, errors.New("Incorrect number of arguments. Expecting 0")
	}
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
	if function == "getOrder" {
		investor := args[0]
		return fns.GetOrder(investor)
	} else if function == "getOrderbook" {
		return fns.GetOrderbook()
	} else if function == "echo" {
		address := args[0]
		f := "echo"
		arg := args[1]
		return fns.Echo(address, f, arg)
	} else if function == "getDealStatus" {
		return fns.GetDealStatus()
	}
	fmt.Println("query did not find func: " + function)

	return nil, errors.New("Received unknown function query: " + function)
}

type Order struct {
	Investor	string 		`json:"investor"`
	Ioi 		float64 	`json:"ioi"`
	Alloc 		float64		`json:"alloc"`
}

// Public Functions

func (c ChaincodeFunctions) GetDealStatus() ([]byte, error)  {
	dealStatus, _ := c.stub.GetState("dealStatus")
	return dealStatus, nil
}

func (c ChaincodeFunctions) UpdateDealStatus(dealStatus string) ([]byte, error)  {
	_ = c.stub.PutState("dealStatus", []byte(dealStatus))
	return nil, nil
}

func (c ChaincodeFunctions) AddOrder(investor string, ioi float64) ([]byte, error)  {
	dealStatus, _ := c.GetDealStatus()
	if(string(dealStatus) != "open") {
		// TEST
		c.stub.SetEvent("Problemo", []byte("Uh oh!"))
		return nil, errors.New("Orders cannot be placed unless deal status is 'Open'")
	}
	order := Order{Investor: investor, Ioi: ioi, Alloc: 0.0}
	c.saveOrderToBlockChain(order)
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
	return nil, nil
}

func (c ChaincodeFunctions) Echo(address string, f string, arg string) ([]byte, error) {
	invokeArgs := util.ToChaincodeArgs(f, arg)
	return c.stub.QueryChaincode(address, invokeArgs)
}

// Private Functions

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