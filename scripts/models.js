var CK_API = "https://api.cryptokitties.co";

// Set up a model to use in our Store
Ext.define('Kitty', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'id',            type: 'int'},
        {name: 'name',          type: 'string'},
        {name: 'image_url',     type: 'string'},
        {name: 'image_url_cdn', type: 'string'},
        {name: 'generation',    type: 'int'},
        {name: 'image_url',     type: 'string'},
        {name: 'created_at',    type: 'string'},
        {name: 'color',         type: 'string'},
        {name: 'is_fancy',      type: 'bool'},
        {name: 'is_exclusive',  type: 'bool'},
        {name: 'fancy_type',    type: 'string'},
        //{name: 'status',    type: 'string'}, // object
        //{name: 'purrs',    type: 'string'},
        //{name: 'watchlist',    type: 'string'},
        {name: 'hatched',       type: 'bool'},
        //{name: 'auction',    type: 'string'}, // object
        //{name: 'owner',    type: 'string'}, // object
        //{name: 'sire',    type: 'string'}, // object
        //{name: 'matron',    type: 'string'}, // object
    ]
});

function createPlayerKittiesStore() {
    return Ext.create('Ext.data.Store', {
        model: 'Kitty',
        autoLoad: false,
        proxy: {
            type: 'ajax',
            reader: {
                type: 'json',
                root: 'kitties'
            }
        },
        sorters: [{
             property: 'generation',
             direction: 'ASC'
         }]
    });
}

function createPlayerKittiesView(store, target) {
    var kittyTpl = new Ext.XTemplate(
        '<tpl for=".">',
            '<div class="thumb-wrap">',
                '<div class="u-bg-alt-{color}"><img class="largeThumbNail" src="{image_url}"></div>',
                '<div>{id} - {name}</div>',
            '</div>',
        '</tpl>'
    );

    return Ext.create('Ext.view.View', {
        store: store,
        tpl: kittyTpl,
        itemSelector: 'div.thumb-wrap',
        emptyText: 'No images available',
        renderTo: Ext.Element.get('player-kitties')
    });
}

function requestPlayerKitties(addr, offset=0, limit=20, parents=false) {
    //console.log(`${CK_API}/kitties?offset=${offset}&limit=${limit}&owner_wallet_address=${addr}&parents=${parents}`);
    Ext.Ajax.request({
        url: `${CK_API}/kitties?offset=${offset}&limit=${limit}&owner_wallet_address=${addr}&parents=${parents}`,

        success: function(response, opts) {
            var obj = Ext.decode(response.responseText);
            playerKitties.loadRawData(obj, true);
            if (offset + limit < obj.total)
                requestPlayerKitties(addr, offset+limit, limit, parents);
        },

        failure: function(response, opts) {
            console.log('server-side failure with status code ' + response.status);
        }
    });
}

function populationPlayerKitties(addr) {
    console.log("populationPlayerKitties");
    //playerKitties.clear();
    playerKitties = createPlayerKittiesStore();
    createPlayerKittiesView(playerKitties);
    requestPlayerKitties(addr.toLowerCase());
}

Ext.define('Seller', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'address',  type: 'string'},
        {name: 'nickname', type: 'string'},
        {name: 'image',    type: 'string'}
    ]
});

Ext.define('Auction', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'start_price',   type: 'string'},
        {name: 'end_price',     type: 'string'},
        {name: 'start_time',    type: 'string'},
        {name: 'end_time',      type: 'string'},
        {name: 'current_price', type: 'string'},
        {name: 'duration',      type: 'string'},
        {name: 'status',        type: 'string'},
        {name: 'type',          type: 'string'},
        {name: 'id',             type: 'int'},
    ],
    hasOne: [{
        model: 'Kitty',
        name: 'kitty'
    }, {
        model: 'Seller',
        name: 'seller'
    }]
});

function createAuctionsStore() {
    return Ext.create('Ext.data.Store', {
        model: 'Auction',
        autoLoad: false,
        proxy: {
            type: 'ajax',
            reader: {
                type: 'json',
                root: 'auctions'
            }
        },
        sorters: [{
             property: 'start_time',
             direction: 'DESC'
         }]
    });
}

function createAuctionsView(store, target) {
    var kittyTpl = new Ext.XTemplate(
        '<tpl for=".">',
            '<div class="thumb-wrap">',
                '<a href="https://www.cryptokitties.co/kitty/{kitty.id}" target="_blank">',
                    '<div class="u-bg-alt-{kitty.color}"><img class="largeThumbNail" src="{kitty.image_url}"></div>',
                '</a>',
                '<div>{kitty.id} - {[this.convertPrice(values.current_price)]}</div>',
            '</div>',
        '</tpl>',
        {
            disableFormats: true,
            convertPrice: function(wei) {
                var l = 4 + wei.length - 19;
                var s = 0; //todo
                var sigDigits = wei.substr(0,l);
                while (sigDigits.length < 4) // TODO: better this
                    sigDigits = "0" + sigDigits; // LOL
                // TODO: this should be format string (but was causing code to break)
                return sigDigits[s] + '.' + sigDigits.substr(1);
            }
        }
    );

    return Ext.create('Ext.view.View', {
        store: store,
        tpl: kittyTpl,
        itemSelector: 'div.thumb-wrap',
        emptyText: 'No images available',
        renderTo: Ext.Element.get('auctions')
    });
}

function requestAuctions(offset=0, limit=20, parents=false) {
    Ext.Ajax.request({
        // TODO: variable type here
        url: `${CK_API}/auctions?offset=${offset}&limit=${limit}&type=sale&parents=${parents}`,

        success: function(response, opts) {
            var obj = Ext.decode(response.responseText);
            auctions.loadRawData(obj, true);
            if (offset + limit < obj.total)
                requestAuctions(offset+limit, limit, parents);
        },

        failure: function(response, opts) {
            console.log('server-side failure with status code ' + response.status);
        }
    });
}

function populationAuctions() {
    console.log("populationAuctions");
    auctions = createAuctionsStore();
    createAuctionsView(auctions);
    requestAuctions();
}