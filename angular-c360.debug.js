/**
 * angular-c360 - Angular components for working with data from Configurator 360
 * @version v0.4.0
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
(function () {
    'use strict';

    angular
    .module('angular-c360')
    .directive('c360Prop', c360Prop);

    function c360Prop($compile) {
        return {
            compile: compile,
            priority: 1000,
            restrict: 'A',
            terminal: true
        };

        function compile(elem, attrs) {
            var prop = attrs.c360Prop;

            // Remove the attribute so it doesn't get processed again
            elem.removeAttr('c360-prop');

            // Add all of these attributes unconditionally
            elem.addClass('c360-prop');
            elem.attr('ng-model', prop + '.BoundValue');
            elem.attr('ng-class', '{ \'c360-modified\': ' + prop + '.IsModified, \'c360-invalid\': ' + prop + '.ErrorInfo }');
            elem.attr('ng-disabled', prop + '.IsReadOnly');
            elem.attr('tooltip', '{{' + prop + '.Tooltip}}');
            elem.attr('tooltip-popup-delay', '1000');

            // Add the remaining attributes only if they're not already set, so that they
            //  can be overridden on a case-by-case basis

            if (!angular.isDefined(elem.attr('ng-model-options'))) {
                elem.attr('ng-model-options', '{ updateOn: ' + prop + '.updateOn }');
            }

            if (elem[0].nodeName === 'INPUT' && !angular.isDefined(elem.attr('type'))) {
                elem.attr('type', '{{' + prop + '.inputType}}');
            }

            if (elem[0].nodeName === 'SELECT' && !angular.isDefined(elem.attr('ng-options'))) {
                elem.attr('ng-options', 'choice.value as choice.text for choice in ' + prop + '.ChoiceList');
            }

            return {
                pre: function preLink(scope, iElement, iAttrs, controller) { },
                post: function postLink(scope, iElement, iAttrs, controller) {
                    $compile(iElement)(scope);
                }
            };
        }
    }
    c360Prop.$inject = ['$compile'];
})();
(function () {
    'use strict';

    angular
    .module('angular-c360')
    .directive('c360Viewer', c360Viewer);

    function c360Viewer($window, $timeout) {
        var _viewerDivId = 'c360Viewer';

        return {
            restrict: 'E',
            link: function (scope, element, attrs, ctrl) {
                var viewerElement = angular.element('#' + _viewerDivId);

                scope.$on('$destroy', function (args) {
                    $window.addEventListener('resize', null, false);
                    viewerElement.offset({ top: 0, left: 0 });
                    // Use z-index rather than visibility to hide/show, since the viewer apparently
                    //  doesn't updated itself when hidden
                    viewerElement.css('z-index', '-1');
                });

                $window.addEventListener('resize', positionViewer, false);

                // Wait for any other dynamic position to settle down first, then position viewer
                $timeout(function () {
                    positionViewer();
                }, 100);

                function positionViewer() {
                    // Use z-index rather than visibility to hide/show, since the viewer apparently
                    //  doesn't updated itself when hidden
                    viewerElement.css('z-index', '1');

                    viewerElement.offset(element.offset());

                    var width = element.width();
                    var widthPx = width + 'px';
                    var height = element.height();
                    var heightPx = height + 'px';

                    viewerElement.css('width', widthPx);
                    viewerElement.css('height', heightPx);

                    // Just setting the css would do it, but since c360 sets the width and height
                    //  attributes on iframe, we'll set them here to in order to prevent any confusion
                    var iFrame = angular.element(viewerElement.children()[0]);
                    iFrame.css('width', widthPx);
                    iFrame.width(width);
                    iFrame.css('height', heightPx);
                    iFrame.height(height);
                }
            }
        };
    }
    c360Viewer.$inject = ['$window', '$timeout'];
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
                getPartByUiProp: getPartByUiProp,
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

            function getPartByUiProp(partType, propName, propValue) {
                var part = null;

                // Use breeze to filter down to just parts of the correct type
                var query = breeze.EntityQuery
                    .from('UIParts')
                    .toType('UIPart')
                    .where('PartType', '==', partType);
                var partsOfType = _manager.executeQueryLocally(query);

                // Now filter to just the parts that match the UiProp
                var matchingParts = partsOfType.filter(function (p) { return p[propName] === propValue; })

                if (matchingParts.length > 0) {
                    part = matchingParts[0];
                }

                return part;
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
                        var iframe = angular.element("<iframe src='" + actionResult.url + "' style='display: none;' ></iframe>");
                        angular.element("body").append(iframe);

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

                var viewerElement = angular.element('#' + _viewerDivId);
                if (viewerElement.length === 0) {
                    var body = angular.element('body');
                    viewerElement = angular.element('<div id="' + _viewerDivId + '"></div>').prependTo(body);
                }

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
                    RefChain: part.refChain,
                    Name: part.Name,
                    PartType: part.PartType,
                    ParentRefChain: parentRefChain
                };

                var mergedEntity = _manager.createEntity('UIPart', initialValues, breeze.EntityState.Unchanged,
                    breeze.MergeStrategy.OverwriteChanges);

                if (!mergedEntity.UIProperties || isCompleteChangedPart) {
                    mergedEntity.UIProperties = [];
                }

                if (part.properties) {
                    part.properties.forEach(function (prop) {
                        // TODO - Optimize this so that the first time a part is added its properties aren't searched
                        if (!isCompleteChangedPart) {
                            for (var i = 0, len = mergedEntity.UIProperties.length; i < len; i++) {
                                if (mergedEntity.UIProperties[i].FullName === prop.value.FullName) {
                                    mergedEntity.UIProperties.splice(i, 1);
                                    break;
                                }
                            }
                        }

                        mergedEntity.UIProperties.push(transformProp(prop));
                    });
                }

                mergedEntity.Messages = (part.Messages) ? part.Messages : [];
                mergedEntity.Actions = (part.Actions) ? part.Actions : [];

                function transformProp(prop) {
                    var transformed = prop.value;

                    try {
                        var toolTipObject = JSON.parse(transformed.Tooltip);

                        transformed.Tooltip = toolTipObject.ToolTip;
                        transformed.DataType = toolTipObject.DataType;
                        transformed.CustomData = toolTipObject.CustomData;
                    } catch (e) {
                        transformed.DataType = getDataTypeFromValue(transformed);
                    }

                    function getDataTypeFromValue(prop) {
                        // TODO: Look at value to determine prop type
                        return 'String';
                    }

                    Object.defineProperty(transformed, 'BoundValue', {
                        get: function () {
                            return transformed.Value;
                        },
                        set: function (newValue) {
                            transformed.Value = newValue;
                            updateProperty(part.refChain, prop.name, newValue)
                        },
                        enumerable: true,
                        configurable: true
                    });

                    Object.defineProperty(transformed, 'inputType', {
                        enumerable: true,
                        configurable: false,
                        get: function () {
                            if (transformed.DataType === 'Date') {
                                return 'date';
                            }
                            else if (transformed.DataType === 'Boolean') {
                                return 'checkbox';
                            }
                            else if (transformed.DataType === 'Integer' || transformed.DataType === 'Number') {
                                return 'number';
                            }
                            else {
                                return 'text';
                            }
                        }
                    });

                    Object.defineProperty(transformed, 'isCheckbox', {
                        enumerable: true,
                        configurable: false,
                        get: function () {
                            return (transformed.DataType === 'Boolean');
                        }
                    });

                    Object.defineProperty(transformed, 'hasChoiceList', {
                        enumerable: true,
                        configurable: false,
                        get: function () {
                            return (transformed.ChoiceList != null);
                        }
                    });

                    Object.defineProperty(transformed, 'updateOn', {
                        enumerable: true,
                        configurable: false,
                        get: function () {
                            if (transformed.isCheckbox || transformed.hasChoiceList) {
                                return 'default';
                            }
                            else
                                return 'blur';
                        }
                    });

                    return transformed;
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
                    if (part.RefChain === 'Root') {
                        _rootPart = part;
                    }

                    var propSuffix = '_Prop';

                    // Remove all existing UIProperty properties from the part
                    Object.getOwnPropertyNames(part).forEach(function (propName) {
                        if (propName.endsWith(propSuffix)) {
                            var propNameNoSuffix = propName.replace(propSuffix, '');
                            delete part[propNameNoSuffix];
                            delete part[propName];
                        }
                    });

                    // Add properties for each UI Property and reset function on each UI Property
                    part.UIProperties.forEach(function (uiProp) {
                        var valuePropName = uiProp.FullName.replace(_invalidCharacterPattern, _modelAdapter.invalidCharacterReplacement);
                        var prop = uiProp;

                        // Add property that points to UI Property
                        Object.defineProperty(part, valuePropName, {
                            get: function () {
                                return prop.BoundValue;
                            },
                            set: function (newValue) {
                                prop.BoundValue = newValue;
                            },
                            enumerable: true,
                            configurable: true
                        });

                        // Add reset function
                        prop.reset = function () {
                            resetProperty(part.RefChain, prop.UiRuleName);
                        };

                        var propPropName = valuePropName + propSuffix;
                        part[propPropName] = uiProp;
                    });

                    // Add properties as shortcuts to each child
                    part.Children.forEach(function (uiChild) {
                        var childName = uiChild.Name.replace(_invalidCharacterPattern, _modelAdapter.invalidCharacterReplacement);
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
                        var collectionName = _modelAdapter.parseCollectionName(part.Name);

                        Object.defineProperty(part.Parent, collectionName, {
                            get: function () {
                                return part.Children;
                            },
                            enumerable: true,
                            configurable: true
                        });
                    }

                    if (part.Actions) {
                        part.Actions.forEach(function (action) {
                            part[action.Name] = function (params) {
                                var actionData = {
                                    refChain: part.RefChain,
                                    name: action.Name,
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
            return part.Name.endsWith('Collection');
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
                    RefChain: {dataType: DT.String, isPartOfKey: true},
                    Name: {dataType: DT.String},
                    PartType: {dataType: DT.String},
                    ParentRefChain: { dataType: DT.String }
                },
                navigationProperties: {
                    Parent: {
                        entityTypeName: 'UIPart:#C360', isScalar: true,
                        associationName: 'UIPart_UIPart', foreignKeyNames: ['ParentRefChain']
                    },
                    Children: {
                        entityTypeName: 'UIPart:#C360', isScalar: false,
                        associationName: 'UIPart_UIPart'
                    }
                }
            });
        }
    }
})();