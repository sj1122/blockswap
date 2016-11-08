package main

import (
	"errors"
	"fmt"
	"strconv"
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
)

type SimpleChaincode struct { }

func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

// Init resets all the things
func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	if len(args) > 0 {
		return nil, errors.New("Incorrect number of arguments. Expecting 0")
	}
	_ = stub.PutState("orderbook", []byte("{}"))
	return nil, nil
}

// Invoke is our entry point to invoke a chaincode function
func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Println("invoke is running " + function)

	// Handle different functions
	if function == "addOrder" {
		investor := args[0]
		ioi, err := strconv.ParseFloat(args[1], 64)
		if err != nil {
	        return nil, errors.New("Failed to parse " + args[1] + " as a float64")
    	}
		return t.addOrder(stub, investor, ioi)
	} else if function == "allocateOrder" {
		investor := args[0]
		alloc, err := strconv.ParseFloat(args[1], 64)
		if err != nil {
	        return nil, errors.New("Failed to parse " + args[1] + " as a float64")
    	}
		return t.allocateOrder(stub, investor, alloc)	
	}
	fmt.Println("invoke did not find func: " + function)

	return nil, errors.New("Received unknown function invocation: " + function)
}

// Query is our entry point for queries
func (t *SimpleChaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Println("query is running " + function)

	// Handle different functions
	if function == "init" {
		t.Init(stub, function, args)
	} else if function == "getOrder" { //read a variable
		investor := args[0]
		return t.getOrder(stub, investor)
	}
	fmt.Println("query did not find func: " + function)

	return nil, errors.New("Received unknown function query: " + function)
}

type Order struct {
	Investor	string 		`json:"investor"`
	Ioi 		float64 	`json:"ioi"`
	Alloc 		float64		`json:"alloc"`
}

func (t *SimpleChaincode) addOrder(stub shim.ChaincodeStubInterface, investor string, ioi float64) ([]byte, error)  {
	order := Order{Investor: investor, Ioi: ioi, Alloc: 0.0}
	saveOrderToBlockChain(stub, order)
	return nil, nil
}

func (t *SimpleChaincode) getOrder(stub shim.ChaincodeStubInterface, investor string) ([]byte, error) {
	orderJson := getOrderAsJsonFromBlockchain(stub, investor)
	return []byte(orderJson), nil
}

func (t *SimpleChaincode) allocateOrder(stub shim.ChaincodeStubInterface, investor string, alloc float64) ([]byte, error) {
	order := getOrderFromBlockChain(stub, investor)
	order.Alloc = alloc
	saveOrderToBlockChain(stub, order)
	return nil, nil
}

func getOrderAsJsonFromBlockchain(stub shim.ChaincodeStubInterface, investor string) string {
	order := getOrderFromBlockChain(stub, investor)
	orderJson, _ := json.Marshal(order)
	return string(orderJson)
}

func getOrderFromBlockChain(stub shim.ChaincodeStubInterface, investor string) Order {
	orderbook := getOrderbookFromBlockChain(stub)
	return orderbook[investor]
}

func saveOrderToBlockChain(stub shim.ChaincodeStubInterface, order Order) {
	orderbook := getOrderbookFromBlockChain(stub)
	orderbook[order.Investor] = order
	saveOrderbookToBlockChain(stub, orderbook)
}

func getOrderbookFromBlockChain(stub shim.ChaincodeStubInterface) map[string]Order {
	orderbookJson, _ := stub.GetState("orderbook")
	var orderbook map[string]Order
	_ = json.Unmarshal(orderbookJson, &orderbook)
	return orderbook
}

func saveOrderbookToBlockChain(stub shim.ChaincodeStubInterface, orderbook map[string]Order) {
	orderbookJson, _ := json.Marshal(orderbook)
	_ = stub.PutState("orderbook", []byte(orderbookJson))
}

