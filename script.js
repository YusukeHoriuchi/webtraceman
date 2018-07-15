
// TracemanCore
var trace = {
  //エレメント系
  input      : null,
  inButton   : null,

  table      : null,

  badge      : null,
  previews   : null,

  processCvs : null,
  processCtx : null,
  editCvs    : null,
  editCtx    : null,
  editSize   : null,

  black      : null,
  blackBar   : null,
  red        : null,
  redBar     : null,
  blue       : null,
  blueBar    : null,

  fileName   : null,
  fileStart  : null,
  transparency: null,

  output     : null,
  progress   : null,
  download   : null,
  cancel     : null,
  close      : null,


  //内部ファイル系
  files      : null,
  lock       : false,
  index      : -1,
  cancelFlag : false,

  //初期設定系
  H_THRETH      : 0.7,
  BLACK_THRETH  : 0.9,
  COLOR_WIDTH   : 30.0,

};

// ファイル保存用オブジェクト
var ListObj = function(){
  this.name   =null;
  //this.mime   =null;
  this.img    = null;
  this.thumbnail  = null;
  this.size = null;
  this.type = null;
  this.width  = null;
  this.height = null;
}


window.onload   = function(){
  init();
  console.log(trace);
};

// 初期化処理
function init(){
  var t = trace;

  //ファイル配列
  t.files = new Array();
  t.index = -1;

  //仮想input
  t.input = document.createElement("input");
  t.input.type      = "file";
  t.input.accept    = "image/*";
  t.input.multiple  = true;
  t.input.addEventListener("change",input,false);
  //ファイル入力ボタン
  t.inButton  = document.getElementById("inputButton");
  t.inButton.addEventListener("click",function(){t.input.click();},false);

  //入力ファイル表
  t.table = document.getElementById("loadedTable");

  //バッジ
  t.badge = document.getElementById("badge");
  //プレビュー欄
  t.previews  = document.getElementById("previews");

  //内部キャンバス
  t.processCvs = document.createElement("canvas");
  t.processCtx = t.processCvs.getContext("2d");
  //編集画面
  t.editCvs = document.getElementById("editArea");
  t.editCtx = t.editCvs.getContext("2d");
  //編集画面サイズ
  t.editSize  = document.getElementById("editAreaSize");

  //色の閾値設定
  t.colorBar  = document.getElementById("colorBar");
  t.color     = document.getElementById("color");
  t.blackBar  = document.getElementById("blackBar");
  t.black     = document.getElementById("black");
  t.redBar    = document.getElementById("redBar");
  t.red       = document.getElementById("red");
  t.blueBar   = document.getElementById("blueBar");
  t.blue      = document.getElementById("blue");
  t.colorBar.addEventListener("change",changeProperty,false);
  t.color.addEventListener("change",changeProperty,false);
  t.blackBar.addEventListener("change",changeProperty,false);
  t.black.addEventListener("change",changeProperty,false);
  t.redBar.addEventListener("change",changeProperty,false);
  t.red.addEventListener("change",changeProperty,false);
  t.blueBar.addEventListener("change",changeProperty,false);
  t.blue.addEventListener("change",changeProperty,false);





  //ファイル名入力欄
  t.fileName  = document.getElementById("fileName");
  t.fileStart = document.getElementById("fileStart");
  t.transparency  = document.getElementById("transparency");

  //出力ボタン
  t.output  = document.getElementById("output");
  t.output.addEventListener("click",outputFiles,false);
  //進捗表示
  t.progress  = document.getElementById("progress");
  //キャンセルボタン
  t.cancel    = document.getElementById("cancel");
  t.cancel.addEventListener("click",cancel,false);
  //modalバツボタン
  t.close   = document.getElementById("modalClose");
  //仮想ダウンロード
  t.download  = document.createElement("a");


  window.addEventListener("resize",resize,false);

  /* 全エレメント取得後 */
  tableUpdate();
  badgeUpdate();
  previewUpdate();
  processUpdate();
  editUpdate();



}


/* イベント処理系関数 */

//inputが更新されたら行う処理
function input(evt){
  if(trace.lock)return;

  var files = evt.target.files;
  if(files.length==0)return;

  Promise.resolve(files).then(
    lock                                // lockフラグを立てる
  ).then(
    loadFileList                         // 入力されたFileListの読み込んでlistObjに変換
  ).then(
    putListObj                          // 全てfilesに追加
  ).then(
    unlock
  ).then(function(){
    return Promise.all([
      new Promise(function(resolve,reject){
        if(trace.index==-1){                // 現在指定中の画像が無いなら
          trace.index=0;
          Promise.resolve().then(
            processUpdate
          ).then(
            editUpdate
          ).then(
            resolve
          );
        }else{
          console.log("trace.index = "+trace.index);
          resolve();
        }
      }),
      new Promise(function(resolve,reject){
        previewUpdate();
        resolve();
      }),
      new Promise(function(resolve,reject){
        badgeUpdate();
        resolve();
      }),
      new Promise(function(resolve,reject){
        tableUpdate();
        resolve();
      })
    ]);
  }).catch(
    showError
  );
}

//画面がリサイズされたら行う処理
function resize(){
  clearTimeout(trace.timer);
  console.log("window.resize");
  trace.timer = setTimeout(editUpdate,30);
}

// 表の消去ボタンが押されたら行う処理
function deleteFile(evt){
  if(trace.lock)return;

  const index = evt.target.parentElement.parentElement.rowIndex-1;
  console.log("deletFile : "+index);
  Promise.resolve().then(
    lock
  ).then(
    function(){
      if(trace.index  == index){
        if(trace.files.length == 1){                                            //最後の一個の時
          trace.index=-1;
        }
        if(index!=0){                                                           //最後の一個ではない時
          trace.index--;
        }
        return Promise.resolve(index).then(
            deleteListObj
          ).then(
            unlock
          ).then(
            processUpdate
          ).then(
            editUpdate
          );
      }else{
        if(trace.index > index){
          trace.index--;
        }
        return Promise.resolve(index).then(
            deleteListObj
          ).then(
            unlock
          );
      }
    }
  ).then(
    function(){
      return Promise.all([
        new Promise(function(resolve,reject){
          tableUpdate();
          resolve();
        }),
        new Promise(function(resolve,reject){
          badgeUpdate();
          resolve();
        }),
        new Promise(function(resolve,reject){
          previewUpdate();
          resolve();
        })
      ]);
    }
  ).catch(
    showError
  );
}

// サムネイルがクリックされたら行う処理
function selectFile(evt){
  tmpThumbnail  = evt.target.parentElement.parentElement;
  for(let i=0;i<trace.files.length;i++){
    if(trace.files[i].thumbnail == tmpThumbnail){
      trace.index = i;
      break;
    }
  }
  Promise.resolve().then(
    processUpdate
  ).then(
    editUpdate
  ).catch(
    showError
  );
}

// 閾値が変更されたら行う処理
function changeProperty(evt){
  clearTimeout(trace.timer);
  console.log("property changed");
  trace.timer = setTimeout(function(){
    if(evt.target.type==="range"){                                              // バーの方が変更されたら
      const value = Number(evt.target.value);
      evt.target.parentElement.parentElement.children[2].children[0].value  = value;
    }else{                                                                      // テキストボックスの方が変更されたら
      const value = Number(evt.target.value);
      if(isNaN(value)){                                                           //数値以外が入力された時
        evt.target.value = Number(evt.target.parentElement.parentElement.children[1].children[0].value);
      }else{
        if(value <= 0){                                                           //0以下の値が入力された時
          evt.target.value  = 0;
          evt.target.parentElement.parentElement.children[1].children[0].value = 0;
        }else if(value >= 100){                                                   //100以上の値が入力された時
          evt.target.value  = 100;
          evt.target.parentElement.parentElement.children[1].children[0].value = 100;
        }else{                                                                    //通常の値が入力された時
          evt.target.parentElement.parentElement.children[1].children[0].value  = value;
        }
      }
    }
  },0);
}

// 出力ボタンが押されたときに行う処理
function outputFiles(evt){
  setTimeout(downloadAll,0);
}


/* 更新系の処理 */

// 入力ファイル表を更新する関数
function tableUpdate(v){
  console.log("tableUpdate");
  for(let i=0,j=trace.table.rows.length;i<j;i++){
    trace.table.deleteRow(-1);
  }

  if(trace.index==-1){
    const tmpRow  = trace.table.insertRow(-1);
    const tmpCell = tmpRow.insertCell(-1);
    tmpCell.innerHTML = "no file";
  }else{
    for(let i=0;i<trace.files.length;i++){
      const tmpRow  = trace.table.insertRow(-1);
      let   tmpCell = tmpRow.insertCell(-1);
      tmpCell.innerHTML = trace.files[i].name;
      tmpCell = tmpRow.insertCell(-1);
      tmpCell.innerHTML = trace.files[i].type;
      tmpCell = tmpRow.insertCell(-1);
      tmpCell.innerHTML = trace.files[i].width + " × " + trace.files[i].height;
      tmpCell = tmpRow.insertCell(-1);
      tmpCell.innerHTML = trace.files[i].size;
      tmpCell = tmpRow.insertCell(-1);
      let tmpButton = document.createElement("button");
      tmpButton.innerHTML = "消去";
      tmpButton.classList.add("btn","btn-xs","btn-danger");
      tmpButton.addEventListener("click",deleteFile,false);
      tmpCell.appendChild(tmpButton);
    }
  }
  return Promise.resolve(v);
}

// バッジを更新する関数
function badgeUpdate(v){
  console.log("badgeUpdate");
  trace.badge.innerHTML = trace.files.length;
  return Promise.resolve(v);
}

// プレビューを更新する関数
function previewUpdate(v){
  console.log("previewUpdate");
  trace.previews.innerHTML  = "";
  if(trace.index == -1){
    trace.previews.innerHTML  = "no file";
  }else{
    for(let i=0;i<trace.files.length;i++){
      trace.previews.appendChild(trace.files[i].thumbnail);
    }
  }
  return Promise.resolve(v);
}

// 内部処理画面の更新をする関数
function processUpdate(v){
  console.log("processUpdate");
  if(trace.index == -1){
    trace.processCvs.width  = 640;
    trace.processCvs.height = 360;
    trace.processCtx.fillRect(0,0,trace.processCvs.width,trace.processCvs.height);
  }else{
    trace.processCvs.width  = trace.files[trace.index].img.naturalWidth;
    trace.processCvs.height = trace.files[trace.index].img.naturalHeight;
    trace.processCtx.drawImage(trace.files[trace.index].img,0,0,
                              trace.processCvs.width,
                              trace.processCvs.height);
  }
  return Promise.resolve(v);
}

// 編集画面を更新する関数
function editUpdate(v){
  return new Promise(function(resolve,reject){
    console.log("editUpdate");
    trace.editCvs.width   = trace.editSize.clientWidth;
    trace.editCvs.height  = trace.editSize.clientWidth
                              * trace.processCvs.height
                              / trace.processCvs.width;
    const img = new Image();
    img.onload=function(){
      trace.editCtx.drawImage(img,0,0,trace.editCvs.width,trace.editCvs.height);
      resolve(v);
    };
    img.onerror=function(){
      reject("editUpdate error");
    }
    img.src = trace.processCvs.toDataURL();
  });
}

// 進捗表示を更新する関数
function progressUpdate(index){
  trace.progress.innerHTML  = (index+1) + " / " + trace.files.length;
  return Promise.resolve(index);
}


/* スレッド処理系 */

// 処理中であることを示すフラグを立てる
function lock(v){
  trace.lock  = true;
  console.log("locked");
  return Promise.resolve(v);
}

// 処理が終了したことを示すフラグを立てる
function unlock(v){
  trace.lock  = false;
  console.log("unlocked");
  return Promise.resolve(v);
}

// キャンセルフラグを立てる
function cancel(v){
  trace.cancelFlag  = true;
  return Promise.resolve(v);
}

// キャンセルフラグを解除する
function uncancel(v){
  trace.cancelFlag  = false;
  return Promise.resolve(v);
}

// エラーの中身を表示する
function showError(error){
  console.log(error);
}

// Promiseのfor_loop
function sync_loop(init, condition, callback, increment) {
  return new Promise(function(resolve, reject) {
    init().then(function _loop() {
      condition().then(function(result) {
        if (result)
          callback().then(increment).then(_loop, reject);
        else
          resolve();
      }, reject);
    }, reject);
  });
}


/* ファイルリスト操作系 */

// 入力ファイルリストをオブジェクトリストに変換する関数
function loadFileList(fileList){
  var asyncs  = new Array(fileList.length);
  for(let i=0;i<fileList.length;i++){
    asyncs[i] = fileToListObj(fileList[i],i)
  }
  return Promise.all(asyncs);
}

// オブジェクトリストを挿入する関数
function putListObj(get){
  console.log(get);
  for(let i=0;i<get.length;i++){
    trace.files.push(get[i]);
  }
  return Promise.resolve();
}

// Fileを入力するとlistObjを返す関数
function fileToListObj(file,index){
  console.log("fileToListObj : "+index);
  const obj = new ListObj();
  obj.name  = file.name;
  obj.type  = file.type;
  obj.size  = file.size;

  obj.thumbnail = document.createElement("div");
  obj.thumbnail.classList.add("row");
  obj.thumbnail.style.border = "solid 1px black";

  const a = document.createElement("a");
  a.classList.add("col-md-12");
  a.addEventListener("click",selectFile,false);
  obj.thumbnail.appendChild(a);

  return new Promise(
      function(resolve,reject){
        const reader  = new FileReader();
        reader.onload   = function(){
          resolve(reader.result);
        };
        reader.onerror  = function(){
          reject("file read error : fileList["+index+"]");
        };
        reader.readAsDataURL(file);
      }
    ).then(function(data){return new Promise(
      function(resolve,reject){
        const img = new Image();
        img.onload    = function(){
          obj.img = img;
          obj.width = img.naturalWidth;
          obj.height  = img.naturalHeight;
          img.style.display = "block";
          img.style.width = "100%";
          img.style.height = "auto";
          a.appendChild(img);
          resolve(obj);
        };
        img.onerror   = function(){
          reject("image link error : fileList["+index+"]");
        };
        img.src = data;
      }
    );});
}

// 指定個所のファイルを削除する関数
function deleteListObj(index){
  trace.files.splice(index,1);
  return Promise.resolve();
}


/* 計算系 */

// base64をバイナリに変換する
function baseToBin(base){
    var bin = atob(base.replace(/^.*,/,''));
    var buffer  = new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++){
        buffer[i] = bin.charCodeAt(i);
    }
    var blob    = new Blob([buffer.buffer],{
        type: "image/png"
    });
    return blob;
}

// RGBをHLSに変換する
function rgbToHls(color){
  //http://imagingsolution.blog107.fc2.com/blog-entry-247.html参考、近似法を用いる
  color[0]/=255.0;
  color[1]/=255.0;
  color[2]/=255.0;
  let max = 0;
  let min = 1;
  for(let i=0;i<3;i++){
    if(color[i]>max)max=color[i];
    if(color[i]<min)min=color[i];
  }
  let r = color[0];
  let g = color[1];
  let b = color[2];
  let h,l,s;
  if(max==min){
    h = 0.0;
  }else if(max==r){
    h = 60.0 * (g-b) / (max-min);
    if(h<0.0)h+=360.0;
  }else if(max==g){
    h = 60.0 * (b-r) / (max-min) + 120.0;
  }else{
    h = 60.0 * (r-g) / (max-min) + 240.0;
  }
  l = (max+min) / 2.0;
  if(l>0.5){
    if((2.0-max-min)==0.0){
      s = 0.0;
    }else{
      s = (max-min) / (2.0-max-min);
    }
  }else{
    if((max+min)==0.0){
      s = 0.0;
    }else{
      s = (max-min) / (max+min);
    }
  }
  return [h,l,s];
}

// 指定されたindexの画像を変換する
function convertImage(index){
  return new Promise(
    function(resolve,reject){
      console.log("start convert : " + index);
      trace.index = index;
      Promise.resolve().then(
        processUpdate
      ).then(
        editUpdate
      ).then(
        function(){
          return new Promise(function(resolve,reject){
            //convert program
            const rawImage  = trace.processCtx.getImageData(0,0,trace.processCvs.width,trace.processCvs.height);
            const converted = trace.processCtx.createImageData(rawImage);
            const transparency = (trace.transparency.checked === true) ? 0 : 255;
            const blueMin = 210.0 - Number(trace.blue.value) / 1.0;
            const blueMax = 210.0 + Number(trace.blue.value) / 1.0;
            const redMax  = Number(trace.red.value) / 1.0;
            const redMin  = 360.0 - Number(trace.red.value) / 1.0;
            const colorBorder = (100.0 - Number(trace.color.value)) / 100.0;
            const blackBorder = Number(trace.black.value) / 100.0;

            //console.log("transparency checked is " + transparency);
            for(let i=0;i<rawImage.data.length;i+=4){
              const hls = rgbToHls([rawImage.data[i],rawImage.data[i+1],rawImage.data[i+2]]);
              if(hls[2]<colorBorder){
                if(hls[1]<blackBorder){
                  converted.data[i]   = 0;
                  converted.data[i+1] = 0;
                  converted.data[i+2] = 0;
                  converted.data[i+3] = 255;
                }else{
                  converted.data[i]   = 255;
                  converted.data[i+1] = 255;
                  converted.data[i+2] = 255;
                  converted.data[i+3] = transparency;
                }
              }else{
                if(hls[0]>blueMin && hls[0]<blueMax){
                  converted.data[i]   = 0;
                  converted.data[i+1] = 0;
                  converted.data[i+2] = 255;
                  converted.data[i+3] = 255;
                }else if(hls[0]<redMax || hls[0]>redMin){
                  converted.data[i]   = 255;
                  converted.data[i+1] = 0;
                  converted.data[i+2] = 0;
                  converted.data[i+3] = 255;
                }else{
                  converted.data[i]   = 255;
                  converted.data[i+1] = 255;
                  converted.data[i+2] = 255;
                  converted.data[i+3] = transparency;
                }
              }
            }
            trace.processCtx.putImageData(converted,0,0);
            console.log("here convert");
            resolve();
          });
        }
      ).then(
        editUpdate
      ).then(
        function(){
          console.log("show conveted");
          return Promise.resolve();
        }
      ).then(
        resolve
      ).catch(
        showError
      );
    }
  );
}

// ファイル名を決定する関数
function getFileName(index){
  let startIndex  = Number(trace.fileStart.value);
  if(isNaN(startIndex)||startIndex===null||startIndex===undefined){
    startIndex  = 0;
    console.log("startIndex is NaN");
  }
  const fileIndex = startIndex + index;
  let fileName  = trace.fileName.value;
  if(fileName === "" || fileName === null || fileName === undefined){
    fileName = "image_[###].png";
    console.log("fileName is none");
  }

  const match = /\[#+\]/g;

  const separated = fileName.split(match);
  const numbers   = fileName.match(match);

  //console.log(separated);
  //console.log(numbers);
  let result  = "";

  for(let i=0;i<numbers.length;i++){
    let length = numbers[i].length-2;
    result += separated[i];
    if(length>10){
      let zeros = "";
      for(let j=0;j<length;j++){
        zeros += "0";
      }
      result += (zeros + fileIndex).slice(-1*length);
    }else{
      result += ("0000000000"+fileIndex).slice(-1*length);
    }
  }
  result += separated[separated.length-1];

  return result;
}

// すべての画像を書き出す関数
function downloadAll(){
  const tmpIndex  = trace.index;
  let index;
  Promise.resolve().then(
    function(){
      return new Promise(
        function(resolve,reject){
          sync_loop(
            function(){       // init
              return new Promise(
                function(resolve,reject){
                  index = 0;
                  resolve();
                }
              );
            },
            function(){       // condition
              return new Promise(
                function(resolve,reject){
                  console.log("index = "+index);
                  console.log("trace.cancelFlag : "+trace.cancelFlag);
                  resolve(index < trace.files.length && !trace.cancelFlag);
                }
              );
            },
            function(){       // callback
              return new Promise(
                function(resolve,reject){
                  Promise.resolve(index).then(
                    progressUpdate
                  ).then(
                    convertImage
                  ).then(
                    outputFile
                  ).then(
                    resolve
                  );
                }
              );
            },
            function(){       // increment
              return new Promise(
                function(resolve,reject){
                  index++;
                  resolve();
                }
              );
            }
          ).then(
            resolve
          );
        }
      );
    }
  ).then(
    uncancel
  ).then(
    function(){
      trace.close.click();
      trace.index = tmpIndex;
      return Promise.resolve();
    }
  ).then(
    processUpdate
  ).then(
    editUpdate
  ).catch(
    showError
  );
}

// processCvsの中身を書き出す関数
function outputFile(){
  console.log("outputFile : "+ trace.index);
  const base    = trace.processCvs.toDataURL('image/png');                      //canvasの中身を書き出す
  const bin     = baseToBin(base);                                              //書き出した中身をバイナリに変換
  const tmpURL = window.URL.createObjectURL(bin);
  trace.download.download = getFileName(trace.index);
  trace.download.href = tmpURL;
  trace.download.click();
  return Promise.resolve();
}
