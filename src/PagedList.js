function PagedList(numPages, controlsNode, buttonsNode, fetchFunc, renderFunc) {
        
    this.INFINITE = -1;
    
    this.numPages = numPages;
    
    if (this.numPages === this.INFINITE) {        
        this.isInfinite = true;
    } else {
        this.isInfinite = false;
    }
       
    // DOM element in which the page number should be displayed          
    this.controlsNode = controlsNode;      
    
    // DOM element in which the navigation buttons are located       
    this.buttonsNode = buttonsNode;      
    
    // Function that is called for getting the content of a page, if it's not cached 
    this.fetchFunc = fetchFunc;
    
    // Function that is called for rendering the content of a page
    this.renderFunc = renderFunc;
    
    // IDs of the navigation buttons, feel free to set your own if you need
    this.BUTTON_IDS = {
        first : "#pagecontrols_page_first",
        last : "#pagecontrols_page_last",
        forward : "#pagecontrols_page_forward",
        back : "#pagecontrols_page_back"
    };
    
    this.currentPage = 0;
    
    this.pageCache = {};   
    
    this.pageForward = function() {
        var newContents = this.fetchPage(this.currentPage + 1);        
        if (!this.isInfinite) {            
            if (this.currentPage >= this.numPages - 1) {                                       
                throw "Attempt to move past the last page";
            }                                       
        } else {            
            if (newContents === null) {
                console.log("The end is reached on page " + (this.currentPage + 1));
                this.isInfinite = false;
                this.numPages = this.currentPage + 1;
                this.updateControls();
                return;                
            }                         
        }   
        this.currentPage++;
        this.renderFunc(newContents);
        this.updateControls();                            
    };
    
    this.pageBack = function() {
        if (this.currentPage <= 0) {            
            throw "Attempt to move past the first page";            
        } 
        var newContents = this.fetchPage(this.currentPage - 1);
        this.currentPage--;
        this.renderFunc(newContents);
        this.updateControls();        
    };
    
    this.firstPage = function() {
        var newContents = this.fetchPage(0);
        this.currentPage = 0;
        this.renderFunc(newContents);
        this.updateControls();        
    };
    
    this.lastPage = function() {
        if (!this.isInfinite) {
            var newContents = this.fetchPage(this.numPages - 1);
            this.currentPage = this.numPages - 1;
            this.renderFunc(newContents);
            this.updateControls();    
        } else {
            throw("Cannot go to last page on infinite list");
        }               
    };    
    
    this.fetchPage = function(newPage) {
        if (this.pageCache[newPage]) {
            console.log("Getting cached results for page " + newPage);            
            return this.pageCache[newPage];
        } else {
            console.log("Fetching contents for page " + newPage);
            var result = this.fetchFunc(newPage);
            this.pageCache[newPage] = result;
            return result;
        }
    };
    
    this.refresh = function() {               
        this.renderFunc(this.fetchPage(this.currentPage));
        this.updateControls();
    }
    
    this.updateControls = function() {        
        if (this.isInfinite) {
            controlsNode.html((this.currentPage + 1));
        } else {
            controlsNode.html((this.currentPage + 1) + "/" + this.numPages);    
        }        
        this.updateButton(this.BUTTON_IDS.first, true);
        this.updateButton(this.BUTTON_IDS.last, !this.isInfinite);
        this.updateButton(this.BUTTON_IDS.forward, 
            this.isInfinite || (this.currentPage < this.numPages - 1));
        this.updateButton(this.BUTTON_IDS.back, this.currentPage > 0);                       
    };    
    
    this.updateButton = function(buttonId, enabled) {
        var button = this.buttonsNode.children(buttonId);
        if (!button) {
            return;
        }            
        if (enabled) {
            button.removeClass("disabled");
        } else {
            button.addClass("disabled");
        }
    }
}
