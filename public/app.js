'use strict';
var learnjs = {};

learnjs.problems = [
    {
        description: "What is truth?",
        code: "function problem() {return __;}" 
    },
    {
        description: "Simple Math",
        code: "function problem() {return 42 === 6 * __;}" 
    }
]

/**
 * @description problem画面のHTML要素
 */
learnjs.problemView = function(data){
    var problemNumber = parseInt(data, 10);
    var view = $('.templates .problem-view').clone();
    view.find('.title').text('Problem #' + problemNumber);
    learnjs.applyObject(learnjs.problems[problemNumber-1], view);
    return view;
}

/**
 * @description ルーター関数 URLハッシュ値を引数に、view-containerに描画するHTMLを特定し設定する
 */
learnjs.showView = function(hash){
    var routes = {
        '#problem' : learnjs.problemView
    };
    var hashParts = hash.split('-');
    var viewFn = routes[hashParts[0]];
    if(viewFn){
        $('.view-container').empty().append(viewFn(hashParts[1]));
    }
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