certoraRun contracts/registry/index.sol:InstaIndex --verify InstaIndex:certora/specs/insta.index.spec \
  --solc solc7.6 \
#   --rule integrityOfDeposit \
  --msg "$1"