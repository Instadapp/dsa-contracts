/*
Specification file for insta index smart contract verifcation using certora. 
Run the spec using:
    certoraRun contracts/registry/list.sol:InstaList contracts/registry/index.sol:InstaIndex --verify InstaList:certora/specs/insta.list.spec  --link InstaList:index=InstaIndex
*/

using InstaIndex as index

methods {
    instaIndex() returns address envfree => CONSTANT
    accounts() returns uint64 envfree
    accountID(address) returns uint64 envfree
    accountAddr(uint64) returns address envfree
    userLink(address) envfree
    userList(address, uint64) envfree
    accountLink(uint64) envfree
    accountList(uint64,address) envfree
}

/*
should update the links and lists
*/
rule integrityAddAuth { 
    env e;
    address _owner;

    cantBeZero(_owner);
    require(accountID(e.msg.sender) != 0 );

    uint64 user_count_before = userLink(_owner).count;
    uint64 prev_accnt = userLink(_owner).last;
    uint64 accnt_count_before = accountLink(accountID(e.msg.sender)).count;
    address prev_user = accountLink(accountID(e.msg.sender)).last;

    addAuth(e,_owner);

    uint64 user_count_after = userLink(_owner).count;
    uint64 last_accnt = userLink(_owner).last;
    uint64 accnt_count_after = accountLink(accountID(e.msg.sender)).count;
    address last_user = accountLink(accountID(e.msg.sender)).last;

    assert(user_count_after == user_count_before + 1, "user not added");
    assert(accnt_count_after == accnt_count_before + 1, "account not added");
    assert(userList(_owner, prev_accnt).next == accountID(e.msg.sender), "account not added");
    assert(accountList(_owner, prev_user).next == _owner, "user not added");
    assert(last_user == _owner, "accountLink not updated");
    assert(last_accnt == accountID(e.msg.sender), "last account not updated");
    assert(last_user == _owner, "last user not updated");
}

rule integrityRemoveAuth{
    env e;
    address _owner;

    cantBeZero(_owner);
    require(accountID(e.msg.sender) != 0 );

    uint64 user_count_before = userLink(_owner).count;
    uint64 prev_accnt = userLink(_owner).last;
    uint64 accnt_count_before = accountLink(accountID(e.msg.sender)).count;
    address prev_user = accountLink(accountID(e.msg.sender)).last;

    addAuth(e,_owner);

    uint64 user_count_after = userLink(_owner).count;
    uint64 last_accnt = userLink(_owner).last;
    uint64 accnt_count_after = accountLink(accountID(e.msg.sender)).count;
    address last_user = accountLink(accountID(e.msg.sender)).last;

    assert(user_count_after == user_count_before - 1, "user not removed");
    assert(accnt_count_after == accnt_count_before - 1, "account not removed");
    assert(userList(_owner, prev_accnt).prev == last_accnt, "account not added");
    assert(accountList(_owner, prev_user).prev == last_user, "user not added");
}

