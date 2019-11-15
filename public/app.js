/*globals AWS, gaip*/
'use strict';
var learnjs = {
};

learnjs.poolId = "us-east-1:ee8ad0ee-e8dc-43fc-870d-8f33e70c8de7"

learnjs.problems = [
    {
        description: "What is truth?",
        code: "function problem() { return __; }"
    },
    {
        description: "Simple Math",
        code: "function problem() { return 42 === 6 * __; }"
    },
    {
        description: "Simple Math 2",
        code: "function problem() { return 42 === 7 * __; }"
    }
]

/**
 * @description top画面のView
 */

learnjs.landingView = function () {
    return learnjs.template('landing-view');
}

/**
 * @description problem画面のView
 */
learnjs.problemView = function (data) {
    var problemNumber = parseInt(data, 10);
    var view = $('.templates .problem-view').clone();
    var problem = learnjs.problems[problemNumber - 1];
    var result = view.find('.result');
    var answer = view.find('.answer');
    var totalCollectCounter = view.find('.total-collect-counter');

    learnjs.fetchAnswer(problemNumber).then(function (data) {
        if (data.Item) {
            answer.val(data.Item.answer);
        }
    }, function (err) {
        console.log(err);
    });

    learnjs.fetchCount(problemNumber).then(function (data) {
        if (data.Count) {
            totalCollectCounter.text(data.Count);
        }
    }, function (err) {
        console.log(err);
    });

    function checkAnswer() {
        var def = $.Deferred();
        var test = problem.code.replace('__', answer.val()) + 'problem();'
        var worker = new Worker('worker.js');
        worker.onmessage = function (e) {
            if (e.data) {
                def.resolve(e.data);
            } else {
                def.reject();
            }
        }
        worker.postMessage(test);
        return def;
    }

    function checkAnswerClick() {
        checkAnswer().done(function () {
            var flashContent = learnjs.buildCorrectFlash(problemNumber);
            learnjs.flashElement(result, flashContent);
            learnjs.saveAnswer(problemNumber, answer.val());
        }).fail(function () {
            learnjs.flashElement(result, 'Incorrect!');
        })
        // if (checkAnswer()) {
        //     learnjs.flashElement(result, learnjs.buildCorrectFlash(problemNumber));
        //     learnjs.saveAnswer(problemNumber, answer.val());

        // } else {
        //     learnjs.flashElement(result, 'Incorrect!');
        // }
        return false;
    }

    if (problemNumber < learnjs.problems.length) {
        var skipButton = learnjs.template('skip-button');
        skipButton.find('a').attr('href', '#problem-' + (problemNumber + 1));
        $('.nav-list').append(skipButton);
        view.bind('removingView', function () {
            skipButton.remove();
        });
    }

    learnjs.popularAnswersByHttpRequest(problemNumber);

    view.find('.title').text('Problem #' + problemNumber);
    view.find('.check-btn').click(checkAnswerClick);
    learnjs.applyObject(problem, view);

    return view;
}

/**
 * @description problemView正解時の振る舞いをハンドリング
 */
learnjs.buildCorrectFlash = function (problemNumber) {
    var correctTemplate = learnjs.template('correct-flash');
    var correctLink = correctTemplate.find('a');
    if (problemNumber < learnjs.problems.length) {
        correctLink.attr('href', '#problem-' + (problemNumber + 1));
    } else {
        correctLink.attr('href', '');
        correctLink.text("you're finished");
    }
    return correctTemplate
}

/**
 * @description profile画面のView
 */
learnjs.profileView = function () {
    var view = learnjs.template('profile-view');
    learnjs.identity.done(function (identity) {
        view.find('.email').text(identity.email);
    });
    return view;
}

/**
 * @description ルーター関数 URLハッシュ値を引数に、view-containerに描画するHTMLを特定し設定する
 */
learnjs.showView = function (hash) {
    var routes = {
        '': learnjs.landingView,
        '#': learnjs.landingView,
        '#problem': learnjs.problemView,
        '#profile': learnjs.profileView
    };
    var hashParts = hash.split('-');
    var viewFn = routes[hashParts[0]];
    if (viewFn) {
        learnjs.triggerEvent('removingView', []);
        $('.view-container').empty().append(viewFn(hashParts[1]));
    }
}

/**
 * @description templateの読み込み
 */
learnjs.template = function (templateName) {
    return $('.templates .' + templateName).clone();
}

/**
 * @description index.html読み込み完了後に呼び出される処理
 */
learnjs.appOnReady = function () {
    window.onhashchange = function () {
        learnjs.showView(window.location.hash);
    };
    learnjs.showView(window.location.hash);
    learnjs.identity.done(learnjs.addProfileLink);
}

learnjs.addProfileLink = function (profile) {
    var link = learnjs.template('profile-link');
    link.find('a').text(profile.email);
    $('.signin-bar').prepend(link);
}

/**
 * @description データバインディング関数
 */
learnjs.applyObject = function (obj, elem) {
    for (var key in obj) {
        elem.find('[data-name="' + key + '"]').text(obj[key]);
    }
}


/**
 * @description 視覚表現(フェードアウト)
 */
learnjs.flashElement = function (elem, content) {
    elem.fadeOut('fast', function () {
        elem.html(content);
        elem.fadeIn();
    });
}

/**
 * @description view-container のみに有効なEventを実行する
 */
learnjs.triggerEvent = function (name, args) {
    $('.view-container>*').trigger(name, args);
}

/**
 * @description google sign in
*/
function googleSignIn(googleUser) {
    // learnjs.googleSignIn = function (googleUser) {
    console.log(googleUser);
    var id_token = googleUser.getAuthResponse().id_token;
    AWS.config.update({
        region: 'us-east-1',
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: learnjs.poolId,
            Logins: {
                'accounts.google.com': id_token
            }
        })
    });

    function refresh() {
        return gaip.auth2.getuAuthInstance().sighIn({
            prompt: 'login'
        }).then(function (userUpdate) {
            var creds = AWS.config.credentials;
            var newToken = userUpdate.getAuthResponse().id_token;
            creds.params.Logins['accounts.google.com'] = newToken;
            return learnjs.awsRefresh();
        });
    }

    learnjs.awsRefresh().then(function (id) {
        learnjs.identity.resolve({
            id: id,
            email: googleUser.getBasicProfile().getEmail(),
            refresh: refresh
        })
    });
}

learnjs.awsRefresh = function () {
    var deferred = new $.Deferred();
    AWS.config.credentials.refresh(function (err) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(AWS.config.credentials.identityId);
        }
    });
    return deferred.promise();
}

learnjs.identity = new $.Deferred();

/**
 * @description Dynamo Access 
 */
learnjs.sendAWSRequest = function (req, retry) {
    var promise = new $.Deferred();
    req.on('error', function (error) {
        if (error.code === "CredentialsError") {
            learnjs.identity.then(function (identity) {
                return identity.refresh().then(function () {
                    return retry();
                }, function () {
                    promise.reject();
                });
            });
        } else {
            promise.reject(error);
        }
    });
    req.on('success', function (resp) {
        promise.resolve(resp.data);
    });
    req.send();
    return promise;
}

/**
 * @description Dynamo Register answer
 */
learnjs.saveAnswer = function (problemId, answer) {
    return learnjs.identity.then(function (identity) {
        var db = new AWS.DynamoDB.DocumentClient();
        var item = {
            TableName: 'learnjs',
            Item: {
                userId: identity.id,
                problemId: problemId,
                answer: answer
            }
        };
        return learnjs.sendAWSRequest(db.put(item), function () {
            return learnjs.saveAnswer(problemId, answer);
        });
    });
}

/**
 * @description Dynamo get answer
 */
learnjs.fetchAnswer = function (problemId) {
    return learnjs.identity.then(function (identity) {
        var db = new AWS.DynamoDB.DocumentClient();
        var item = {
            TableName: 'learnjs',
            Key: {
                userId: identity.id,
                problemId: problemId
            }
        };
        return learnjs.sendAWSRequest(db.get(item), function () {
            learnjs.fetchAnswer(problemId);
        });
    });
}

/**
 * @description Dynamo get count
 */
learnjs.fetchCount = function (problemId) {
    return learnjs.identity.then(function () {
        var db = new AWS.DynamoDB.DocumentClient();
        var params = {
            TableName: 'learnjs',
            Select: 'COUNT',
            FilterExpression: 'problemId = :problemId',
            ExpressionAttributeValues: { ':problemId': problemId }
        };
        return learnjs.sendAWSRequest(db.scan(params), function () {
            return learnjs.fetchCount(problemId);
        });
    });
}

/**
 * @description call aws service
 */
learnjs.popularAnswers = function (problemId) {
    return learnjs.identity.then(function () {
        var lambda = new AWS.Lambda();
        return learnjs.sendAWSRequest(lambda.invoke({
            FunctionName: 'learnjs_popularAnswers',
            Payload: JSON.stringify({ problemNumber: problemId })
        }), function () {
            return learnjs.popularAnswers(problemId);
        })
    })
}

/**
 * @description call aws service
 */
learnjs.popularAnswersByHttpRequest = function (problemId) {
    return learnjs.identity.then(function () {
        var postData = { "problemNumber": problemId };
        var postDataStr = JSON.stringify(postData);
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    console.log(xhr.responseText);
                } else {
                    console.log("error occuerd in the server side");
                }
            } else {
                console.log("connecting...");
            }
        };
        xhr.open('POST', "https://k3ttl4rxui.execute-api.us-east-1.amazonaws.com/production/popularanswers", true);
        xhr.send(postDataStr);

        // return learnjs.sendAWSRequest(, function () {
        //     return learnjs.popularAnswersByHttpRequest(problemId);
        // })
    });
}