package main

import (
	"errors"
	"github.com/hyperledger/fabric/core/chaincode/shim"
)

type Chaincode struct { }

func main() {
	shim.Start(new(Chaincode))
}

// Init resets all the things
func (t Chaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	return nil, nil
}

func (t Chaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	return nil, errors.New("Received unknown function invocation: " + function)
}

func (t Chaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	return []byte("Echo: " + args[0]), nil
}