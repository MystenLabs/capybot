const SDKConfig = {
    clmmConfig: {
        pools_id:
            '0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0',
        global_config_id:
            '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f',
        admin_cap_id:
            '0x66c70d58c69353714cc6fe2d3a62492d605a96a9821e2bd8274de17219c69980',
        global_vault_id:
            '0xce7bceef26d3ad1f6d9b6f13a953f053e6ed3ca77907516481ce99ae8e588f2b',
    },
    tokenConfig: {
        coin_registry_id:
            '0xe0b8cb7e56d465965cac5c5fe26cba558de35d88b9ec712c40f131f72c600151',
        pool_registry_id:
            '0xab40481f926e686455edf819b4c6485fbbf147a42cf3b95f72ed88c94577e67a',
        coin_list_owner:
            '0x1f6510ee7d8e2b39261bad012f0be0adbecfd75199450b7cbf28efab42dad083',
        pool_list_owner:
            '0x6de133b609ea815e1f6a4d50785b798b134f567ec1f4ee113ae73f6900b4012d',
    },
    launchpadConfig: {
        pools_id:
            '0xfd8d37f7a1276878972d240302c8efe32f577220c1bbc6c8984d8b60dddfcab3',
        admin_cap_id:
            '0x66c70d58c69353714cc6fe2d3a62492d605a96a9821e2bd8274de17219c69980',
        config_cap_id:
            '0x02b8d23f033687579966e182c776fe0287cacdbb18bff56c29f141e29a18a4d1',
        config_pools_id:
            '0x956cdbb06d0fad1aff8f7753cdc58154d8d7a1cf8e1fd7be93efebc786fd7b19',
    },
    xcetusConfig: {
        xcetus_manager_id:
            '0x838b3dbade12b1e602efcaf8c8b818fae643e43176462bf14fd196afa59d1d9d',
        lock_manager_id:
            '0x288b59d9dedb51d0bb6cb5e13bfb30885ecf44f8c9076b6f5221c5ef6644fd28',
        lock_handle_id:
            '0x7c534bb7b8a2cc21538d0dbedd2437cc64f47106cb4c259b9ff921b5c3cb1a49',
        dividend_manager_id:
            '0x721c990bfc031d074341c6059a113a59c1febfbd2faeb62d49dcead8408fa6b5',
    },
    boosterConfig: {
        booster_config_id: '',
        booster_pool_handle: '',
    },
    makerBonusConfig: {
        maker_config_id: '',
        maker_pool_handle: '',
    },
}

export const mainnet = {
    //fullRpcUrl: 'https://sui-mainnet-endpoint.blockvision.org',
    //fullRpcUrl: 'https://rpc-mainnet.suiscan.xyz:443',
    fullRpcUrl: 'https://fullnode.mainnet.sui.io',
    faucetURL: '',
    faucet: {
        faucet_display:
            '0x0588cff9a50e0eaf4cd50d337c1a36570bc1517793fd3303e1513e8ad4d2aa96',
        faucet_router:
            '0x0588cff9a50e0eaf4cd50d337c1a36570bc1517793fd3303e1513e8ad4d2aa96',
    },
    simulationAccount: {
        address:
            '0x326ce9894f08dcaa337fa232641cc34db957aec9ff6614c1186bc9a7508df0bb',
    },
    token: {
        token_display:
            '0x481fb627bf18bc93c02c41ada3cc8b574744ef23c9d5e3136637ae3076e71562',
        config: SDKConfig.tokenConfig,
    },
    clmm: {
        clmm_display:
            '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb',
        clmm_router: {
            cetus: '0xe18f7c41e055692946d2bbaf1531af76d297473d2c2c110a0840befec5960be1',
            deepbook: '',
        },
        config: SDKConfig.clmmConfig,
    },
    launchpad: {
        ido_display:
            '0x80d114c5d474eabc2eb2fcd1a0903f1eb5b5096a8dc4184d72453f7a9be728e4',
        ido_router:
            '0x80d114c5d474eabc2eb2fcd1a0903f1eb5b5096a8dc4184d72453f7a9be728e4',
        config_display:
            '0x631889e37e45cda904a7c34dd3b81df6dd4f33ae125bcd231a28c106e1d298ff',
        config: SDKConfig.launchpadConfig,
    },
    xcetus: {
        xcetus_display:
            '0x9e69acc50ca03bc943c4f7c5304c2a6002d507b51c11913b247159c60422c606',
        xcetus_router:
            '0x9e69acc50ca03bc943c4f7c5304c2a6002d507b51c11913b247159c60422c606',
        dividends_display:
            '0x785248249ac457dfd378bdc6d2fbbfec9d1daf65e9d728b820eb4888c8da2c10',
        dividends_router:
            '0x785248249ac457dfd378bdc6d2fbbfec9d1daf65e9d728b820eb4888c8da2c10',
        cetus_faucet:
            '0x6864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b',
        config: SDKConfig.xcetusConfig,
    },
    booster: {
        booster_display: '',
        booster_router: '',
        config: SDKConfig.boosterConfig,
    },
    maker_bonus: {
        maker_display: '',
        maker_router: '',
        config: SDKConfig.makerBonusConfig,
    },
}
