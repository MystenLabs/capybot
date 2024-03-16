const SDKConfig = {
    clmmConfig: {
        pools_id:
            '0xc090b101978bd6370def2666b7a31d7d07704f84e833e108a969eda86150e8cf',
        global_config_id:
            '0x6f4149091a5aea0e818e7243a13adcfb403842d670b9a2089de058512620687a',
        admin_cap_id:
            '0x66c70d58c69353714cc6fe2d3a62492d605a96a9821e2bd8274de17219c69980',
        global_vault_id:
            '0xf3114a74d54cbe56b3e68f9306661c043ede8c6615f0351b0c3a93ce895e1699',
    },
    tokenConfig: {
        coin_registry_id:
            '0xb52e4b2bef6fe50b91680153c3cf3e685de6390f891bea1c4b6d524629f1f1a9',
        pool_registry_id:
            '0x68a66a7d44840481e2fa9dce43293a31dced955acc086ce019853cb6e6ab774f',
        coin_list_owner:
            '0x1370c41dce1d5fb02b204288c67f0369d4b99f70df0a7bddfdcad7a2a49e3ba2',
        pool_list_owner:
            '0x48bf04dc68a2b9ffe9a901a4903b2ce81157dec1d83b53d0858da3f482ff2539',
    },
    launchpadConfig: {
        pools_id:
            '0xccc10403ab3da4ae943847908e0e674fe1fdab81c6383e4c6dcd0eea0edade3d',
        admin_cap_id:
            '0x8a72713049dbcfc40902ff209dc5e6066fe455d152baa235957c84d7a3b875ed',
        config_cap_id:
            '0x16492b4252b01debb60f8a825334020d7fdb9d895b52f8139c98618de30817fc',
        config_pools_id:
            '0x3b8a3b1fb77e7b21d1f6b6b3afbe083a35621fd8a0fcf40e87cee5c0ef0c51e0',
    },
    xcetusConfig: {
        xcetus_manager_id:
            '0xced552e90dacdfc2f582377f9c2cc976a37734dc5000acbbd53c844218f289b8',
        lock_manager_id:
            '0xff79e9dd0c64e32e044810e279559600f1f3b4292c0c466a06a8538495fa12b1',
        lock_handle_id:
            '0xbccb252b536d8f2b4681c554c35a3a6b42cafe9456cf06dfac7b4055b5e0ee83',
        dividend_manager_id:
            '0x74d23593df2826aeb52c460a1302dd19283907e307ca56aba6914e9882d8bd2a',
    },
    boosterConfig: {
        booster_config_id:
            '0xeba41bf99086b0140713d7dd102e1374281a608bf524cc38f62c1d2bd792715c',
        booster_pool_handle:
            '0x01f9ba86234f661157366b8393eaeba82c8b78bf40fd9728604c3cc142811629',
    },
    makerBonusConfig: { maker_config_id: '', maker_pool_handle: '' },
}

export const testnet = {
    fullRpcUrl: 'https://fullnode.testnet.sui.io',
    faucetURL: '',
    faucet: {
        faucet_display:
            '0x26b3bc67befc214058ca78ea9a2690298d731a2d4309485ec3d40198063c4abc',
        faucet_router:
            '0x26b3bc67befc214058ca78ea9a2690298d731a2d4309485ec3d40198063c4abc',
    },
    simulationAccount: {
        address:
            '0xcd0247d0b67e53dde69b285e7a748e3dc390e8a5244eb9dd9c5c53d95e4cf0aa',
    },
    token: {
        token_display:
            '0x171d9d43dbf30a0ab448a2e268c6708447aa89626153a2b647298ca6449fb718',
        config: SDKConfig.tokenConfig,
    },
    clmm: {
        clmm_display:
            '0x0868b71c0cba55bf0faf6c40df8c179c67a4d0ba0e79965b68b3d72d7dfbf666',
        clmm_router: {
            cetus: '0x952bfb018295752d322ba6d45a4324e250dd7ef3711ae38d4822c47c1844e8e9',
            deepbook: '',
        },
        config: SDKConfig.clmmConfig,
    },
    launchpad: {
        ido_display:
            '0x3beee8416089a5cbff9cfd5c0a2ce2937b0452dc7e2a3ab4dc431c7be05c2335',
        ido_router:
            '0x3beee8416089a5cbff9cfd5c0a2ce2937b0452dc7e2a3ab4dc431c7be05c2335',
        config_display:
            '0x552456f05251705de186666a40949a840f72b3673d9d5beb70f7c37b30b78560',
        config: SDKConfig.launchpadConfig,
    },
    xcetus: {
        xcetus_display:
            '0x6eaee8fb2d5f4f66933902b97124ee9478d6cc8c12a4f174e5c356ffe6369745',
        xcetus_router:
            '0x6eaee8fb2d5f4f66933902b97124ee9478d6cc8c12a4f174e5c356ffe6369745',
        dividends_display:
            '0x27290896c7d484f198f85e16e104121d8506dee83a3e7dee10389c4d477fc014',
        dividends_router:
            '0x27290896c7d484f198f85e16e104121d8506dee83a3e7dee10389c4d477fc014',
        cetus_faucet:
            '0xdc612ad030d4db39334d8e38a99fc6a49fc85b74c036839f13803beae66c6164',
        config: SDKConfig.xcetusConfig,
    },
    booster: {
        booster_display:
            '0xffa4c477b7d991a05ebd4e8cb635d05d8bec129799ddd6407068cfefa8913870',
        booster_router:
            '0xffa4c477b7d991a05ebd4e8cb635d05d8bec129799ddd6407068cfefa8913870',
        config: SDKConfig.boosterConfig,
    },
    maker_bonus: {
        maker_display: '',
        maker_router: '',
        config: SDKConfig.makerBonusConfig,
    },
}
