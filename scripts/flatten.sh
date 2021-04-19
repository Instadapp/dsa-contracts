#!/bin/bash

baseContractPath='contracts'
function find() {
    for file in "$1"/*; do
    if [[ -d "$file" ]]; then
        # echo "directory $file"
        mkdir flatten/$file
        find $file
    elif [[ -f "$file" ]]; then
        echo "Created [`basename "$file"`]"
        npx hardhat flatten $file > flatten/$file
    fi
    done
}

rm -rf flatten/$baseContractPath
mkdir flatten/$baseContractPath
find $baseContractPath