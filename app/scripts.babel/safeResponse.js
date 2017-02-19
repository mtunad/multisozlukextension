safeResponse = function(){

    let validAttrs = [ "class", "id", "href", "style" ];

    this.__removeInvalidAttributes = function(target) {
        let attrs = target.attributes, currentAttr;

        for (let i = attrs.length - 1; i >= 0; i--) {
            currentAttr = attrs[i].name;

            if (attrs[i].specified && validAttrs.indexOf(currentAttr) === -1) {
                target.removeAttribute(currentAttr);
            }

            if (
                currentAttr === "href" &&
                /^(#|javascript[:])/gi.test(target.getAttribute("href"))
            ) {
                target.parentNode.removeChild(target);
            }
        }
    };

    this.__cleanDomString = function(data) {
        let parser = new DOMParser;
        let tmpDom = parser.parseFromString(data, "text/html").body;

        let list, current, currentHref;

        list = tmpDom.querySelectorAll("script,img");

        for (let i = list.length - 1; i >= 0; i--) {
            current = list[i];
            current.parentNode.removeChild(current);
        }

        list = tmpDom.getElementsByTagName("*");

        for (i = list.length - 1; i >= 0; i--) {
            parent.__removeInvalidAttributes(list[i]);
        }

        return tmpDom.innerHTML;
    };

    return{
        cleanDomString: function(html){
            return parent.__cleanDomString(html)
        }
    }
}();