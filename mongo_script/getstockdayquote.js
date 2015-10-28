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
                    "$addToSet": "$high"
                },
                "lows": {
                    "$addToSet": "$low"
                },
                "opens": {
                    "$addToSet": "$open"
                },
                "closes": {
                    "$addToSet": "$close"
                },
                "volumes": {
                    "$addToSet": "$volume"
                },
                "turnover": {
                    "$addToSet": "turnover"
                }
            }
        }
    ],

    // Options
    {
        allowDiskUse: true
    }

    // Created with 3T MongoChef, the GUI for MongoDB - http://3t.io/mongochef

);
