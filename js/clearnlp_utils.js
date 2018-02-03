/**
 * Copyright 2014, Emory University
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
<!--
const COLOR_WHITE      = '#FFFFFF';
const COLOR_BLACK      = '#000000';
const COLOR_RED        = '#FF0000';
const COLOR_GREEN      = '#009900';
const COLOR_BLUE       = '#0000FF';
const COLOR_ORANGE     = '#FF9900';
const COLOR_DARK_GRAY  = '#D0D0D0';
const COLOR_LIGHT_GRAY = '#F0F0F0';
const COLOR_PINK       = '#FFC0CB';

function numberWithCommas(number)
{
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function isSymbol(form)
{
    return form.search(/^['!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^_`{|}~']+$/g) >= 0;
}

function sum(array)
{
    var i, t = 0, size = array.length;

    for (i=0; i<size; i++)
        t += array[i];

    return t;
}

function sumNested(array)
{
    var i, t = 0, size = array.length;

    for (i=0; i<size; i++)
        t += sum(array[i]);

    return t;
}

function createArray(size, value)
{
    var array = []

    for (var i=0; i<size; i++)
        array.push(value)

    return array
}

function createNestedEmptyArray(length)
{
    var array = [];
    var i;

    for (i=0; i<length; i++)
        array.push([]);

    return array;
}

function isUndefined(object)
{
    return typeof(object) === 'undefined';
}

function getFontWidth(ctx, font, str)
{
    ctx.beginPath();
    ctx.font = font;
    var width = ctx.measureText(str).width;
    ctx.closePath();
    return width;
}

function descendingOrder(a, b)
{
    return b - a;
}

function removeAll(element)
{
    while (element.firstChild) element.removeChild(element.firstChild);
}

function percent(correct, total)
{
    return (total > 0) ? 100.0 * correct / total : 0;
}

function f1(precision, recall)
{
    return (precision == 0 || recall == 0) ? 0 : 2 * precision * recall / (precision + recall)
}

// ----------------------------------- Helper Methods ------------------------------------

function getDEPTreesFromText(text, isGold)
{
    var lines = text.split(DELIM_NODE), fields;
    var tree  = new DEPTree();
    var trees = [];

    for (var i=0; i<lines.length; i++)
    {
        fields = lines[i].trim().split(DELIM_FIELD);

        if (fields.length < 4)
        {
        	_addDEPTree(trees, tree, isGold);
			tree = new DEPTree();
        }
        else
            tree.addNode(new DEPNode(fields));
    }

    _addDEPTree(trees, tree, isGold);
    return trees;
}

// Called by getDEPTreesFromText().
function _addDEPTree(trees, tree, isGold)
{
	if (tree.size() > 1)
	{
		tree.initChildren();
		if (isGold)
	    {
	        tree.checkSymbols();
	        tree.checkNonProjective();
	    }
		trees.push(tree);
	}
}

// ----------------------------------- Create Elements -----------------------------------

function createBR()
{
    return document.createElement('br');
}

function createHeader(n, text)
{
    var h = document.createElement('h'+n);
    h.innerHTML = text;
    return h;
}

function createText(text)
{
    return document.createTextNode(text);
}

function createTextField(id, value, width)
{
    var tf = document.createElement('input');
    tf.setAttribute('type', 'text');
    tf.setAttribute('id', id);
    tf.setAttribute('value', value);
    tf.setAttribute('style', 'width:'+width+'px');
    return tf;
}

function createCheckbox(id, checked)
{
    var cb = document.createElement('input');
    cb.setAttribute('type', 'checkbox');
    cb.setAttribute('id', id);
    cb.setAttribute('checked', checked);
    return cb;
}

function createRadio(id, group, checked)
{
    var rd = document.createElement('input');
    rd.setAttribute('type', 'radio');
    rd.setAttribute('id', id);
    rd.setAttribute('name', group);
    rd.setAttribute('checked', checked);
    return rd;
}




-->
