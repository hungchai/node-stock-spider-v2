db.stockDayQuote.aggregate(
    // Pipeline
    [
        // Stage 1
        {
            $match: {
                "symbol": "00968:HK"
            }
        },

        // Stage 2
        {
            $sort: {
                "symbol": 1,
                "date": 1
            }
        },

        // Stage 3
    {
        $group: {
            "_id": "$symbol",
            "highs": {
                "$push": "$high"
            },
            "lows": {
                "$push": "$low"
            },
            "opens": {
                "$push": "$open"
            },
            "closes": {
                "$push": "$close"
            },
            "volumes": {
                "$push": "$volume"
            },
            "turnover": {
                "$push": "$turnover"
            }
        }
    },

        // Stage 4
        {
            $out: "symbolQuote"
    }
    ],

    // Options
    {
        allowDiskUse: true
    }

    // Created with 3T MongoChef, the GUI for MongoDB - http://3t.io/mongochef

);
