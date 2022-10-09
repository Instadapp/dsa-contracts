/*
Specification file for insta index smart contract verifcation using certora. 
Run the spec using:
    certoraRun contracts/registry/index.sol:InstaIndex contracts/registry/list.sol:InstaList --verify InstaIndex:certora/specs/insta.index.spec  --link InstaIndex:list=InstaList
*/

using InstaIndex as index

methods {
    instaIndex() returns address envfree => CONSTANT
    changeCheck(uint256, address)
    connectors(uint256) returns address envfree
    account(uint256) returns address envfree
    check(uint256) returns address envfree
    version() returns uint256 envfree => PER_CALLEE_CONSTANT
    isClone(uint256, address) returns bool envfree
    versionCount() returns uint256 envfree
    accounts() returns uint64 envfree
    accountID(address) returns uint64 envfree
    accountAddr(uint64) returns address envfree
    userLink(address) envfree
    userList(address, uint64) envfree
    accountLink(uint64) envfree
    accountList(uint64,address) envfree
}

ghost address _master;
ghost address oldMaster;

hook Sstore master address master_ (address oldMaster_) STORAGE {
    oldMaster = oldMaster_;
    _master = master_;
}

function calledByMaster(env e) returns bool { return e.msg.sender == _master;}
function cantBeZero(address addr) { require(addr != 0); }
invariant masterNonZero() master() != 0
invariant versionCountNotZero() versionCount() != 0

rule integrityChange { 
    method f;
    env e;

    assert f.selector == changeCheck(uint256,address).selector || f.selector == changeMaster(address).selector || f.selector == addNewAccount(address, address, address).selector => calledByMaster(e) == true; 
}

rule masterCanBeChangedByMaster {
    env e;
    method f;
    calldataarg args;

    cantBeZero(master());
    require master() == _master;
    address old_ = master();

    f(e, args);

    assert f.selector == updateMaster().selector => master() == _master && oldMaster == old_ && master() == e.msg.sender;
}

rule integrityChangeCheck(address newCheck, uint256 accountVersion) {
    env e;
    cantBeZero(newCheck);

    address oldCheck = check(accountVersion);
    require oldCheck != newCheck;
    changeCheck(e,accountVersion, newCheck);

    assert (check(accountVersion) == newCheck, "check-not-changed-as-expected");
}

rule integrityAddAccount {
    env e;
    address _newAccount;
    address _connectors;
    address _check;

    cantBeZero(_newAccount);

    require(account(versionCount()) != 0);
    /* require(_newAccount.version() == versionCount()) */

    uint256 _oldVersion = versionCount();
    address _oldAccount = account(_oldVersion + 1);

    addNewAccount(e, _newAccount, _connectors, _check);
    uint256 _newVersion = versionCount();
    address _newAccnt = account(_newVersion);

    assert(_newVersion == _oldVersion + 1, "version-didn't-upgrade");
    assert(_newAccnt == _newAccount, "account-not-added");
    assert(connectors(_newVersion) == _connectors, "connectors-not-updated");
    assert(check(_newVersion) == _check, "check-module-not-updated");
}

rule integrityBuild {
    env e;
    address _owner;
    uint256 _version;
    address _origin;

    require(_version != 0 && _version <= versionCount());
    uint64 accounts_before = list.accounts();
    address _dsa = build(e, _owner, _version, _origin);
    uint64 accounts_after = list.accounts();
    
    assert(isClone(_version, _dsa) == true, "not-cloned");
    assert(accounts_after == accounts_before + 1, "account-count-mismatch");
    assert(list.accountID(_dsa) != 0, "not-dsa");
    assert(list.accountAddr(accounts_after) == _dsa, "dsaID-mismatch"); 
}

