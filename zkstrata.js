(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("zkstrata", function() {

  var keywords = set("as and compliant equal for greater instance is less member merkle of preimage proof root than that this to unequal witness");

  return {
    token: function(stream, state) {
      var ch = stream.next();
      
      /* multi line comment */
      if (state.blockComment && ch == "*" && stream.eat("/")) { state.blockComment = false; return "comment"; }
      if (state.blockComment || ch == "/" && stream.eat("*")) { state.blockComment = true; return "comment"; }

      /* single line comment */
      if (ch == "/" && stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }

      /* string literal */
      if (state.stringLiteral && ch == "\\" && stream.eat("'")) { return "string"; }
      if (state.stringLiteral && ch == "'") { state.stringLiteral = false; return "string"; }
      if (!state.stringLiteral && ch == "'") { state.stringLiteral = true; return "string"; }
      if (state.stringLiteral) return "string";
    
      /* hex literal */
      if (ch == "0" && stream.match(/^[xX][0-9a-fA-F]+/))
        return "number";
      
      /* integer literal */
      if (ch.charCodeAt(0) > 47 && ch.charCodeAt(0) < 58) 
        return "number";

      /* keywords */
      if (/\w/.test(ch)) {
        stream.eatWhile(/\w/);
        var word = stream.current().toLowerCase();
        if (keywords.hasOwnProperty(word)) 
          return "keyword";
      }
      
      /* nothing found, continue */
      return null;
    },
    startState: function() {
      return {
        blockComment: false,
        stringLiteral: false
      };
    }
  };
});

// turn a space-separated list into an array
function set(str) {
  var obj = {}, words = str.split(" ");
  for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
  return obj;
}

CodeMirror.defineMIME("zkstrata", "zkstrata");

});
