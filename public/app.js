'use strict';
var learnjs = {};

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

 learnjs.landingView = function(){
    return learnjs.template('landing-view');
 }

/**
 * @description problem画面のView
 */
learnjs.problemView = function(data){
    var problemNumber = parseInt(data, 10);
    var view = $('.templates .problem-view').clone();
    var problem = learnjs.problems[problemNumber-1];
    var result = view.find('.result');

    function checkAnswer(){
        var answer = view.find('.answer').val();
        var fnString = problem.code.replace('__',answer) + 'problem();'
        return eval(fnString);
    };

    function checkAnswerClick(){
        if(checkAnswer()){
            learnjs.flashElement(result, learnjs.buildCorrectFlash(problemNumber));

        }else{
            learnjs.flashElement(result,'Incorrect!');
        }
        return false;
    }

    if(problemNumber < learnjs.problems.length){
        var skipButton = learnjs.template('skip-button');
        skipButton.find('a').attr('href','#problem-'+ (problemNumber +1 ));
        $('.nav-list').append(skipButton);
        view.bind('removingView',function(){
            skipButton.remove();
        });
    }

    view.find('.title').text('Problem #' + problemNumber);
    view.find('.check-btn').click(checkAnswerClick);
    learnjs.applyObject(problem, view);

    return view;
}

/**
 * @description problemView正解時の振る舞いをハンドリング
 */
learnjs.buildCorrectFlash = function(problemNumber){
    var correctTemplate = learnjs.template('correct-flash');
    var correctLink = correctTemplate.find('a');
    if(problemNumber < learnjs.problems.length){
        correctLink.attr('href','#problem-' + (problemNumber + 1));
    }else{
        correctLink.attr('href','');
        correctLink.text("you're finished");
    }
    return correctTemplate
}

/**
 * @description ルーター関数 URLハッシュ値を引数に、view-containerに描画するHTMLを特定し設定する
 */
learnjs.showView = function(hash){
    var routes = {
        '': learnjs.landingView,
        '#': learnjs.landingView,
        '#problem' : learnjs.problemView
    };
    var hashParts = hash.split('-');
    var viewFn = routes[hashParts[0]];
    if(viewFn){
        learnjs.triggerEvent('removingView',[]);
        $('.view-container').empty().append(viewFn(hashParts[1]));
    }
}

/**
 * @description templateの読み込み
 */
learnjs.template = function(templateName){
    return $('.templates .'+templateName).clone();
}

/**
 * @description index.html読み込み完了後に呼び出される処理
 */
learnjs.appOnReady = function(problemNumber){
    window.onhashchange = function(){
        learnjs.showView(window.location.hash);
    };
    learnjs.showView(window.location.hash);
}

/**
 * @description データバインディング関数
 */
learnjs.applyObject = function(obj, elem){
    for(var key in obj) {
        elem.find('[data-name="' + key +'"]').text(obj[key]);
    }
}

/**
 * @description 視覚表現(フェードアウト)
 */
learnjs.flashElement = function(elem, content){
    elem.fadeOut('fast', function(){
        elem.html(content);
        elem.fadeIn();
    });
}

/**
 * @description view-container のみに有効なEventを実行する
 */
learnjs.triggerEvent = function(name,args){
    $('.view-container>*').trigger(name,args);
}