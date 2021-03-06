/**
 * angular-c360 - Angular components for working with data from Configurator 360
 * @version v0.6.1
 * (c) 2016 D3 Automation  http://d3tech.net/solutions/automation/
 * License: MIT
 */
(function () {
    angular
        .module("angular-c360", [
            "breeze.angular",
        ]);
})();

/* Copied from MDN:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
 */
if (!String.prototype.endsWith) {
    Object.defineProperty(String.prototype, 'endsWith', {
        value: function (searchString, position) {
            var subjectString = this.toString();
            if (position === undefined || position > subjectString.length) {
                position = subjectString.length;
            }
            position -= searchString.length;
            var lastIndex = subjectString.indexOf(searchString, position);
            return lastIndex !== -1 && lastIndex === position;
        }
    });
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
    };
}
function UIProperty(c360Context, hostPart, adeskProp) {
    this.c360Context = c360Context;
    this.hostPart = hostPart;
    this.adeskProp = adeskProp;
    this.parseTooltip();
    this.parseChoiceList();
}
Object.defineProperty(UIProperty.prototype, "category", {
    get: function () {
        return this.adeskProp.Category;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "choiceList", {
    get: function () {
        return this.choiceListData;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "choiceListDisplayMode", {
    get: function () {
        return this.adeskProp.ChoiceListDisplayMode;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "customData", {
    get: function () {
        return this.customDataValue;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "dataType", {
    get: function () {
        return this.dataTypeValue;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "errorInfo", {
    get: function () {
        return this.adeskProp.ErrorInfo;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "fullName", {
    get: function () {
        return this.adeskProp.FullName;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "inputType", {
    get: function () {
        if (this.dataType === 'date') {
            return 'date';
        }
        else if (this.dataType === 'boolean') {
            return 'checkbox';
        }
        else if (this.dataType === 'integer' || this.dataType === 'number') {
            return 'number';
        }
        else {
            return 'text';
        }
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "invParamName", {
    get: function () {
        return this.adeskProp.InvParamName;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "isCheckbox", {
    get: function () {
        return (this.dataType === 'boolean');
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "isLocked", {
    get: function () {
        return this.adeskProp.IsLocked;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "isModified", {
    get: function () {
        return this.adeskProp.IsModified;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "isReadOnly", {
    get: function () {
        return this.adeskProp.IsReadOnly;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "part", {
    get: function () {
        return this.hostPart;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "precision", {
    get: function () {
        return this.adeskProp.Precision;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "restrictToList", {
    get: function () {
        return this.adeskProp.RestrictToList;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "sequence", {
    get: function () {
        return this.adeskProp.Sequence;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "tooltip", {
    get: function () {
        return this.adeskProp.Tooltip;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "uiRuleName", {
    get: function () {
        return this.adeskProp.UiRuleName;
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "value", {
    get: function () {
        return this.adeskProp.Value;
    },
    set: function (newValue) {
        this.adeskProp.Value = newValue;
        this.c360Context.updateProperty(this.part.refChain, this.uiRuleName, newValue);
    },
    enumerable: true,
    configurable: true
});
Object.defineProperty(UIProperty.prototype, "hasChoiceList", {
    get: function () {
        return this.choiceList && this.choiceList.length > 0;
    },
    enumerable: true,
    configurable: true
});
UIProperty.prototype.reset = function () {
    this.c360Context.resetProperty(this.part.refChain, this.uiRuleName);
};
UIProperty.prototype.parseChoiceList = function () {
    if (this.adeskProp.ChoiceList) {
        var prop = this;

        this.choiceListData = this.adeskProp.ChoiceList.map(function (choice) {
            return { 
                value: prop.convertChoiceListValue(choice.DisplayString),
                text: choice.DisplayString
            };
        });
    }
};
UIProperty.prototype.parseTooltip = function () {
    try {
        var toolTipObject = JSON.parse(this.adeskProp.Tooltip);
        this.toolTipValue = toolTipObject.ToolTip;
        this.dataTypeValue = toolTipObject.DataType.toLowerCase();
        this.customDataValue = toolTipObject.CustomData;
    }
    catch (e) {
        this.dataTypeValue = this.getDataTypeFromValue();
    }
};
UIProperty.prototype.getDataTypeFromValue = function () {
    if (typeof(this.value) === 'number') {
        return "number"
    } else if (this.value instanceof Date) {
        return "date"
    } else if (typeof(this.value) === 'boolean') {
        return "boolean"
    } else {
        return "string";
    }
};
UIProperty.prototype.convertChoiceListValue = function (itemValue) {
    switch (this.dataType) {
        case "string":
            return itemValue;
        case "number":
            return parseFloat(itemValue);
        case "integer":
            return parseInt(itemValue);
        case "boolean":
            return (itemValue === "True" || itemValue === "true");
        default:
            return itemValue;
    }
};

(function () {
    'use strict';

    angular
    .module('angular-c360')
    .directive('c360Prop', c360Prop);

    /* @ngInject */
    function c360Prop($compile, $injector) {
        var templateUrl = 'c360Prop.html';

        try {
            templateUrl = $injector.get('c360PropTemplateUrl');
        }
        catch(err) {
        }

        return {
            restrict: 'E',
            scope: {
                uiProp: '=',
                labelText: '@'
            },
            controller: ['$scope', function ($scope) {
                setLabel();

                $scope.$watch('uiProp', function (newValue, oldValue) {
                    setLabel();
                });

                function setLabel() {
                    if ($scope.uiProp && !$scope.labelText) {
                        $scope.labelText = $scope.uiProp.fullName;
                    }
                }
            }],
            templateUrl: templateUrl
        }
    }
    c360Prop.$inject = ['$compile', '$injector'];
})();
(function () {
    'use strict';

    angular
    .module('angular-c360')
    .directive('c360Viewer', c360Viewer);

    function c360Viewer($window, $timeout, c360ViewerUtils) {
        var _viewerDivId = 'c360Viewer';

        return {
            restrict: 'E',
            link: function (scope, element, attrs, ctrl) {
                var viewerElement = document.getElementById(_viewerDivId);

                // Keep track of the component element in a service, so that we can use it in the IE11 $destroy hack below 
                c360ViewerUtils.componentElement = element;

                scope.$on('$destroy', function (args) {
                    $window.addEventListener('resize', null, false);
                    
                    // In IE11, the timing the $destroy event is for some reason different than in other browsers.
                    //  When navigating between two views that both use the viewer, the $destroy on the old view
                    //  is happening after the viewer is created on the new view, so we need to make sure to only
                    //  return the 
                    if (c360ViewerUtils.componentElement === element) {
                        viewerElement.style.top = "0";
                        viewerElement.style.left = "0";
                        // Use z-index rather than visibility to hide/show, since the viewer apparently
                        //  doesn't updated itself when hidden
                        viewerElement.style.zIndex = "-1";

                        c360ViewerUtils.componentElement = undefined;
                    }
                });

                $window.addEventListener('resize', positionViewer, false);

                // Wait for any other dynamic position to settle down first, then position viewer
                $timeout(function () {
                    positionViewer();
                }, 100);

                function positionViewer() {
                    var widthPx = element[0].clientWidth + "px";
                    var heightPx = element[0].clientHeight + "px";
                    var offset = calculateOffset(element[0]);

                    // Use z-index rather than visibility to hide/show, since the viewer apparently
                    //  doesn't updated itself when hidden
                    viewerElement.style.zIndex = "1";
                    viewerElement.style.top = offset.top + "px";
                    viewerElement.style.left = offset.left + "px";
                    viewerElement.style.width = widthPx;
                    viewerElement.style.height = heightPx;

                    var iFrame = viewerElement.firstElementChild;
                    iFrame.style.width = widthPx;
                    iFrame.style.height = heightPx;

                    function calculateOffset(el) {
                        var parent = el.offsetParent;
                        var offset = {
                            top: el.offsetTop,
                            left: el.offsetLeft
                        };
                        
                        while(parent !== null) {
                            offset.top += parent.offsetTop;
                            offset.left += parent.offsetLeft;
                            parent = parent.offsetParent;
                        }

                        return offset;
                    }
                }
            }
        };
    }
    c360Viewer.$inject = ['$window', '$timeout', 'c360ViewerUtils'];
})();
(function () {
    'use strict';

    angular
        .module('angular-c360')
        .provider('c360Context', C360ContextProvider);

    function C360ContextProvider() {
        var _designKey = '';

        /*jshint validthis: true */
        this.setDesignKey = function (designKey) {
            _designKey = designKey;
        };

        this.$get = c360ContextFactory;

        /* @ngInject */
        // jshint maxstatements:60
        function c360ContextFactory(breeze, $log, c360Model,
            $q, $rootScope, $http, $interval, $window, $timeout) {

            var C360 = window.ADSK && window.ADSK.C360;
            var _modelAdapter = new DefaultModelAdapter();
            var _rootPart = null;
            var _updateInProgress = false;
            var _actionExecuting = false;
            var _isDirty = false;
            var _invalidCharacterPattern = /[\s\%\/\?\)\(\.\']/g;
            var _manager = new breeze.EntityManager();
            var _viewer = null;
            var _lastError = null;
            // TODO: Store viewer div id in constant?
            var _viewerDivId = 'c360Viewer';

            initialize();

            function initialize() {
                c360Model.initialize(_manager.metadataStore);
            }

            var service = {
                getNewModel: getNewModel,
                loadModel: loadModel,
                getRoot: getRoot,
                getParts: getParts,
                getPartByRefChain: getPartByRefChain,
                updateProperty: updateProperty,
                updateProperties: updateProperties,
                resetProperty: resetProperty,
                executeAction: executeAction,
                endSession: endSession,
                isDirty: isDirty,
                setDirty: setDirty,
                isModelLoaded: isModelLoaded,
                setModelAdapter: setModelAdapter,
                getViewer: function () { return _viewer; },
                getLastError: function () { return _lastError; }
            };

            return service;

            //#region public methods

            function getNewModel() {
                return initializeViewer();
            }

            function loadModel(modelBlob) {
                return initializeViewer(modelBlob);
            }

            function getRoot() {
                return _rootPart;
            }

            function getParts() {
                return _manager.getEntities('UIPart');
            }

            function getPartByRefChain(refChain) {
                return _manager.getEntityByKey('UIPart', refChain);
            }

            function updateProperty(refChain, name, value) {
                _updateInProgress = true;

                var deferred = $q.defer();

                $rootScope.$broadcast('C360ModelUpdating', { promise: deferred.promise });

                _viewer.setPropertyValues({
                    refChain: refChain,
                    properties: [
                        {
                            name: name,
                            value: value
                        }
                    ]
                }, onSuccess, onError);

                return deferred.promise;

                function onSuccess(modelData) {
                    updateModel(modelData);
                    setDirty(true);
                    deferred.resolve();
                }

                function onError(error) {
                    $log.error('', 'Error updating property');
                    handleError(error);
                    deferred.reject();
                }
            }

            function updateProperties(properties) {
                _updateInProgress = true;

                var deferred = $q.defer();

                $rootScope.$broadcast('C360ModelUpdating', { promise: deferred.promise });

                _viewer.setPropertyValues(properties, onSuccess, onError);

                return deferred.promise;

                function onSuccess(modelData) {
                    updateModel(modelData);
                    setDirty(true);
                    deferred.resolve();
                }

                function onError(error) {
                    $log.error('', 'Error updating property');
                    handleError(error);
                    deferred.reject();
                }
            }

            function resetProperty(refChain, name) {
                return updateProperty(refChain, name, null);
            }

            function executeAction(actionParams) {
                if (_actionExecuting) {
                    $log.info('Unable to execute action ' + actionParams.name +
                        ' while another action is in progress');

                    return $q.reject();
                }

                $log.info('Executing action ' + actionParams.name);

                var deferred = $q.defer();
                _actionExecuting = true;
                deferred.promise.finally(function () {
                    _actionExecuting = false;
                });

                if (actionParams.params) {
                    _viewer.setPropertyValues({ uiActionParams: JSON.stringify(actionParams.params) }, function () {
                        doExecute()
                    });
                }
                else {
                    doExecute();
                }

                function doExecute() {
                    _viewer.executeAction(actionParams, onSuccess, onError)
                    $rootScope.$broadcast('C360ActionExecuting', { promise: deferred.promise });
                }

                return deferred.promise;

                function onSuccess(actionResult) {
                    var message = null;

                    if (actionResult.url) {
                        // Download output
                        var iframe = document.createElement("iframe");
                        iframe.setAttribute("src", actionResult.url);
                        iframe.style.display = "none";
                        document.body.appendChild(iframe);

                        $timeout(function() {
                            iframe.remove();    
                        }, 1000);                       
                        
                        deferred.resolve();
                    }
                    else if (angular.isDefined(actionResult.title) && angular.isDefined(actionResult.message)) {
                        var message = null;

                        try {
                            message = JSON.parse(actionResult.message);
                        } catch (e) {
                            message = actionResult.message;
                        }

                        deferred.resolve(message);
                    }
                    else {
                        updateModel(actionResult);
                        setDirty(true);
                        deferred.resolve();
                    }
                }

                function onError(error) {
                    $log.error('', 'Error occurred while executing action ' + actionParams.name);
                    handleError(payload.data);
                    deferred.reject(error);
                }
            }

            function endSession() {
                clearModel();
            }

            function isDirty() {
                return _isDirty;
            }

            function isModelLoaded() {
                return (_rootPart !== null);
            }

            function setModelAdapter(adapter) {
                if (adapter.invalidCharacterReplacement && angular.isString(adapter.invalidCharacterReplacement)) {
                    _modelAdapter.invalidCharacterReplacement = adapter.invalidCharacterReplacement;
                }

                if (adapter.visitPart && angular.isFunction(adapter.visitPart)) {
                    _modelAdapter.visitPart = adapter.visitPart;
                }

                if (adapter.isPartCollection && angular.isFunction(adapter.isPartCollection)) {
                    _modelAdapter.isPartCollection = adapter.isPartCollection;
                }

                if (adapter.parseCollectionName && angular.isFunction(adapter.parseCollectionName)) {
                    _modelAdapter.parseCollectionName = adapter.parseCollectionName;
                }
            }

            //#endregion

            //#region private methods

            function initializeViewer(modelBlob) {
                clearModel();

                var viewerElement = document.getElementById(_viewerDivId);
                if (!viewerElement) {
                    viewerElement = document.createElement("div");
                    viewerElement.setAttribute("id", _viewerDivId);
                    
                    document.body.insertBefore(viewerElement, document.body.firstChild);
                }
                viewerElement.style.position = "absolute";
                viewerElement.style.zIndex = "-1";

                var deferred = $q.defer();

                var viewerOptions = {
                    container: viewerElement,
                    design: _designKey,
                    panes: false,
                    success: viewerLoaded,
                    error: failedToLoad,
                    verbose: true
                }

                if (modelBlob) {
                    viewerOptions.openFromFile = modelBlob;
                }

                // Check client compatibility and load the viewer if compatible.
                C360.checkCompatibility(function (result) {
                    if (result.compatible) {
                        C360.initViewer(viewerOptions);
                    } else {
                        _lastError = result.reason;
                        deferred.reject(result.reason);
                    }
                });

                function viewerLoaded(viewer) {
                    _viewer = viewer;
                    _viewer.getPropertyValues(null, function (modelData) {
                        updateModel(modelData);
                        $rootScope.$broadcast('C360ModelReset', _rootPart);
                        deferred.resolve(_rootPart);
                    });
                }

                function failedToLoad(viewer) {
                    _viewer = viewer;
                    deferred.reject(viewer.state);
                }

                return deferred.promise;
            }

            function updateModel(modelData) {
                _lastError = null;

                // Updated the entity manager with new/updated entities
                mergePart(modelData, modelData.parentRefChain);

                // Detach deleted entities
                if (modelData.removedRefChains) {
                    modelData.removedRefChains.forEach(function (refChain) {
                        var partToRemove = getPartByRefChain(refChain);
                        if (partToRemove) {
                            if (partToRemove.Parent && partToRemove.Parent.hasOwnProperty(partToRemove.Name)) {
                                delete partToRemove.Parent[partToRemove.Name];
                            }

                            _manager.detachEntity(partToRemove);
                        }
                    })
                }

                // Post-process parts (add shortcut properties, action methods, etc.)
                processParts(_manager.getEntities('UIPart'))

                $rootScope.$broadcast('C360ModelUpdated');
            }

            function mergePart(part, parentRefChain) {
                var initialValues = null;
                var childEntities = [];
                var isCompleteChangedPart = (angular.isDefined(part.isCompleteChangedPart) && part.isCompleteChangedPart === true);

                initialValues = {
                    refChain: part.refChain,
                    name: part.Name,
                    partType: part.PartType,
                    parentRefChain: parentRefChain
                };

                var mergedEntity = _manager.createEntity('UIPart', initialValues, breeze.EntityState.Unchanged,
                    breeze.MergeStrategy.OverwriteChanges);

                // Remove functions on existing part that executed each action
                if (mergedEntity.actions) {
                    mergedEntity.actions.forEach(function(a) {
                        delete mergedEntity[a.name];
                    }); 
                }                

                // Remove properties that point to UIProperties
                if (mergedEntity.uiProperties) {
                    mergedEntity.uiProperties.forEach(function(p) {
                        delete mergedEntity[p.fullName];
                    }); 
                }                

                if (!mergedEntity.uiProperties || isCompleteChangedPart) {
                    mergedEntity.uiProperties = [];
                }

                if (part.properties) {
                    part.properties.forEach(function (prop) {
                        // TODO - Optimize this so that the first time a part is added its properties aren't searched
                        if (!isCompleteChangedPart) {
                            for (var i = 0, len = mergedEntity.uiProperties.length; i < len; i++) {
                                if (mergedEntity.uiProperties[i].fullName === prop.value.FullName) {
                                    mergedEntity.uiProperties.splice(i, 1);
                                    break;
                                }
                            }
                        }

                        mergedEntity.uiProperties.push(new UIProperty(service, mergedEntity, prop.value));
                    });
                }

                mergedEntity.messages = [];
                if (part.Messages) {
                    part.Messages.forEach(function(m)  {
                        mergedEntity.messages.push({ messageText: m.MessageText, severity: m.Severity });
                    });
                }

                mergedEntity.actions = [];
                if (part.Actions) {
                    part.Actions.forEach(function(a) {
                        mergedEntity.actions.push({ name: a.Name, category: a.Category, menuText: a.MenuText, tooltip: a.tooltip });
                    });
                }

                if (part.children) {
                    part.children.forEach(function (child) {
                        mergePart(child, part.refChain);
                    });
                }
            }

            function processParts(parts) {
                // First pass is to watch for root and add some shortcuts
                parts.forEach(function (part) {
                    if (part.refChain === 'Root') {
                        _rootPart = part;
                    }

                    // Add properties for each UI Property and reset function on each UI Property
                    part.uiProperties.forEach(function (uiProp) {
                        var propName = uiProp.fullName.replace(_invalidCharacterPattern, _modelAdapter.invalidCharacterReplacement);
                        part[propName] = uiProp;
                    });

                    // Add properties as shortcuts to each child
                    part.children.forEach(function (uiChild) {
                        var childName = uiChild.name.replace(_invalidCharacterPattern, _modelAdapter.invalidCharacterReplacement);
                        var child = uiChild;

                        Object.defineProperty(part, childName, {
                            get: function () {
                                return child;
                            },
                            enumerable: true,
                            configurable: true
                        });
                    });

                    // Add shortcut to collection's children if applicable
                    if (_modelAdapter.isPartCollection(part)) {
                        var collectionName = _modelAdapter.parseCollectionName(part.name);

                        Object.defineProperty(part.parent, collectionName, {
                            get: function () {
                                return part.children;
                            },
                            enumerable: true,
                            configurable: true
                        });
                    }

                    if (part.actions) {
                        part.actions.forEach(function (action) {
                            part[action.name] = function (params) {
                                var actionData = {
                                    refChain: part.refChain,
                                    name: action.name,
                                    params: params
                                };

                                return executeAction(actionData);
                            };
                        });
                    }
                });

                // Now allow for custom processing
                parts.forEach(function (part) {
                    _modelAdapter.visitPart(part);
                });
            }

            function clearModel() {
                _rootPart = null;
                _manager.clear();
                setDirty(false);

                if (_viewer) {
                    _viewer.unload();
                    _viewer = null;
                }
            }

            function handleError(error) {
                var broadcastError = {
                        code: 0,
                        message: 'Server Unavailable',
                        details: ''
                };

                $rootScope.$broadcast('C360Error', { error: broadcastError });
            }

            function setDirty(dirty) {
                if (!angular.isDefined(dirty)) {
                    dirty = true;
                }

                _isDirty = dirty;
            }

            function onSessionEnded() {
                onModelClosed();
            }

            function onModelClosed() {
                clearModel();
                $rootScope.$broadcast('C360ModelClosed');
            }

            //#endregion
        }
        c360ContextFactory.$inject = ['breeze', '$log', 'c360Model', '$q', '$rootScope', '$http', '$interval', '$window', '$timeout'];
    }

    function DefaultModelAdapter() {
        var self = this;

        self.invalidCharacterReplacement = '';
        self.visitPart = visitPart;
        self.isPartCollection = isPartCollection;
        self.parseCollectionName = parseCollectionName;

        function isPartCollection(part) {
            return part.name.endsWith('Collection');
        }

        function parseCollectionName(partName) {
            var single = partName.replace('Collection', '');
            var plural = null;

            if (single.endsWith('y')) {
                plural = single.substring(0, single.length - 1) + 'ies';
            } else {
                plural = single + 's';
            }

            return plural;
        }

        function visitPart(part) { }
    }
})();
(function () {
    angular
        .module('angular-c360')
        .factory('c360Model', c360Model);

    function c360Model() {
        var DT = breeze.DataType; // alias
        return {
            initialize: initialize
        };

        function initialize(metadataStore) {
            metadataStore.addEntityType({
                shortName: 'UIPart',
                namespace: 'C360',
                dataProperties: {
                    refChain: {dataType: DT.String, isPartOfKey: true},
                    name: {dataType: DT.String},
                    partType: {dataType: DT.String},
                    parentRefChain: { dataType: DT.String }
                },
                navigationProperties: {
                    parent: {
                        entityTypeName: 'UIPart:#C360', isScalar: true,
                        associationName: 'UIPart_UIPart', foreignKeyNames: ['parentRefChain']
                    },
                    children: {
                        entityTypeName: 'UIPart:#C360', isScalar: false,
                        associationName: 'UIPart_UIPart'
                    }
                }
            });
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('angular-c360')
        .factory('c360ViewerUtils', c360ViewerUtils);

    /* @ngInject */
    function c360ViewerUtils() {
        return {
            componentElement: undefined
        };
    }
})();
angular.module("angular-c360").run(["$templateCache", function($templateCache) {$templateCache.put("c360Prop.html","<div ng-if=\"uiProp\"><div ng-if=\"!uiProp.isCheckbox && uiProp.choiceList == null\"><label>{{labelText}}</label><input ng-model=\"uiProp.value\" ng-model-options=\"{ updateOn: \'blur\' }\" placeholder=\"{{uiProp.fullName}}\" ng-class=\"{ \'c360-modified\': uiProp.isModified, \'c360-invalid\': uiProp.errorInfo }\" ng-disabled=\"uiProp.isReadOnly\" type=\"{{uiProp.inputType}}\"></div><div ng-if=\"uiProp.choiceList != null\"><label>{{labelText}}</label><select ng-model=\"uiProp.value\" ng-options=\"choice.value as choice.text for choice in uiProp.choiceList\" ng-class=\"{ \'c360-modified\': uiProp.isModified, \'c360-invalid\': uiProp.errorInfo }\" ng-disabled=\"uiProp.isReadOnly\"></select></div><div ng-if=\"uiProp.isCheckbox\"><label><input ng-model=\"uiProp.value\" placeholder=\"uiProp.fullName\" ng-class=\"{ \'c360-modified\': uiProp.isModified, \'c360-invalid\': uiProp.errorInfo }\" ng-disabled=\"uiProp.isReadOnly\" type=\"checkbox\"> {{labelText}}</label></div></div>");}]);