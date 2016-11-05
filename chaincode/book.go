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
	return nil, nil
}

// Invoke is our entry point to invoke a chaincode function
func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Println("invoke is running " + function)

	// Handle different functions
	if function == "addOrder" {
		investor := args[0]
		ioi, _ := strconv.ParseFloat(args[1], 64)
		return t.addOrder(stub, investor, ioi)
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
	investor	string
	ioi 		float64
	alloc 		float64
}

func (t *SimpleChaincode) addOrder(stub shim.ChaincodeStubInterface, investor string, ioi float64) ([]byte, error)  {
	order := Order{investor: investor, ioi: ioi}
	orderJson, _ := json.Marshal(order)
	orderJsonBytes := []byte(orderJson)
	stub.PutState(investor, []byte(orderJson))
	return orderJsonBytes, nil
}

func (t *SimpleChaincode) getOrder(stub shim.ChaincodeStubInterface, investor string) ([]byte, error) {
	orderJsonBytes, _ := stub.GetState(investor)
	return orderJsonBytes, nil
}