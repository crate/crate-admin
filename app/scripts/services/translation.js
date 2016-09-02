'use strict';

angular.module('translation', [])
    .factory('Translation', [

        function() {
            var TranslationService = this;
            TranslationService.interpolate = function(sentence, terms) {
                for (var term in terms) {
                    var regex = new RegExp("\\{" + term + "\\}", "gi");
                    sentence = sentence.replace(regex, terms[term]);
                }
                return sentence;
            };

            return TranslationService;
        }
    ]);