use candid::Principal;
use ic_cdk::management_canister::{create_canister, CanisterSettings, CreateCanisterArgs};


struct TokenInitArgs{
    name : String,
    symbol : String, 
    supply : String,
    decimals : u32,
    initial_suuply :u64,
    owner : Principal

}

#[ic_cdk::update]
async fn create_token_canister(name : String , symbol : String, supply : u64){
    let canister_id : Principal = create_canister(&CreateCanisterArgs{
        settings : Some(CanisterSettings{
            controllers : Some(vec![ic_cdk::api::msg_caller()]),
            ..Default::default()
        }),

    })
    .await
    .expect("create_canister failed")
    .canister_id;

}