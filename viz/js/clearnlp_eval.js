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
const CHART_SPACE = "chart_space";

const LABELS_ACC  = ['LAS','UAS','LS'];
const LABELS_SEN  = ['<=10','<=20','<=30','<=40','<=50','>50'];
const LABELS_DEP  = ['<-5','-5','-4','-3','-2','-1','1','2','3','4','5','>5'];

const SEN_NUM = LABELS_SEN.length;
const DEP_NUM = LABELS_DEP.length;

const TD_WIDTH = 80;
const LIGHT_GRAY = '#D0D0D0';
const WHITE      = '#FFFFFF';
const F0F0F0     = '#F0F0F0';


// ----------------------------------------- I/O -----------------------------------------

var g_trees;
var s_trees  = [];
var s_scores = [];

function readGoldFile(file)
{
    initDEPTreesFromFile(file, true);
    document.getElementById('systemFiles').disabled = true;
    document.getElementById('evaluateButton').disabled = true;
}

function readSystemFiles(files)
{
    // clear previous system information
    while (s_trees .length > 0) s_trees .pop();
    while (s_scores.length > 0) s_scores.pop();
    document.getElementById('evaluateButton').disabled = true;

    // add new text-fields given system filenames
    var i, size = files.length;

    for (i=0; i<size; i++)
        initDEPTreesFromFile(files[i], false, size);
}

function initDEPTreesFromFile(file, isGold, len)
{
    var reader = new FileReader();
    reader.readAsText(file);

    reader.onload = function(e)
    {
        trees = getDEPTreesFromText(e.target.result, isGold);

        if (isGold)
        {
            g_trees = trees;
            document.getElementById('systemFiles').disabled = false;
        }
        else
        {
            s_trees.push(trees);
            s_scores.push(new Score(file.name, true));

            if (s_scores.length == len)
                document.getElementById('evaluateButton').disabled = false;
        }
    };
}

// -------------------------------------- Evaluate ---------------------------------------

function Score(name, more)
{
    this.name = name;
    this.init(more);
}

Score.prototype.init = function(more)
{
    // all tokens
    this.total = 0;
    this.las   = 0;
    this.uas   = 0;
    this.ls    = 0;

    // all tokens without symbols
    this.ptotal = 0;
    this.plas   = 0;
    this.puas   = 0;
    this.pls    = 0;

    // exact matches
    this.exact = 0;
    this.elas  = 0;
    this.euas  = 0;
    this.els   = 0;

    // exact matches without symbols
    this.pexact = 0;
    this.pelas  = 0;
    this.peuas  = 0;
    this.pels   = 0;

    if (more)
    {
        // by sentence lengths
        this.stotal = createArray(SEN_NUM, 0);
        this.slas   = createArray(SEN_NUM, 0);
        this.suas   = createArray(SEN_NUM, 0);

        // by sentence lengths without symbols
        this.pstotal = createArray(SEN_NUM, 0);
        this.pslas   = createArray(SEN_NUM, 0);
        this.psuas   = createArray(SEN_NUM, 0);

        // by dependency distances//
//         this.dtotal = createArray(DEP_NUM, 0);
//         this.dlas   = createArray(DEP_NUM, 0);
//         this.duas   = createArray(DEP_NUM, 0);
//
//         // by dependency distances without symbols
//         this.pdtotal = createArray(DEP_NUM, 0);
//         this.pdlas   = createArray(DEP_NUM, 0);
//         this.pduas   = createArray(DEP_NUM, 0);
    }
}

Score.prototype.addAll = function(score)
{
    this.total += score.total;
    this.las   += score.las;
    this.uas   += score.uas;
    this.ls    += score.ls;

    this.ptotal += score.ptotal;
    this.plas   += score.plas;
    this.puas   += score.puas;
    this.pls    += score.pls;

    this.exact += score.exact;
    this.elas  += score.elas;
    this.euas  += score.euas;
    this.els   += score.els;

    this.pexact += score.pexact;
    this.pelas  += score.pelas;
    this.peuas  += score.peuas;
    this.pels   += score.pels;
}

Score.prototype.finalize = function(score)
{
    this.las = (this.total > 0) ? 100.0 * this.las / this.total : 0;
    this.uas = (this.total > 0) ? 100.0 * this.uas / this.total : 0;
    this.ls  = (this.total > 0) ? 100.0 * this.ls  / this.total : 0;

    this.plas = (this.ptotal > 0) ? 100.0 * this.plas / this.ptotal : 0;
    this.puas = (this.ptotal > 0) ? 100.0 * this.puas / this.ptotal : 0;
    this.pls  = (this.ptotal > 0) ? 100.0 * this.pls  / this.ptotal : 0;

    this.elas = (this.exact > 0) ? 100.0 * this.elas / this.exact : 0;
    this.euas = (this.exact > 0) ? 100.0 * this.euas / this.exact : 0;
    this.els  = (this.exact > 0) ? 100.0 * this.els  / this.exact : 0;

    this.pelas = (this.pexact > 0) ? 100.0 * this.pelas / this.pexact : 0;
    this.peuas = (this.pexact > 0) ? 100.0 * this.peuas / this.pexact : 0;
    this.pels  = (this.pexact > 0) ? 100.0 * this.pels  / this.pexact : 0;

    for (var i=0; i<SEN_NUM; i++)
    {
        this.slas[i] = (this.stotal[i] > 0) ? 100.0 * this.slas[i] / this.stotal[i] : 0;
        this.suas[i] = (this.stotal[i] > 0) ? 100.0 * this.suas[i] / this.stotal[i] : 0;

        this.pslas[i] = (this.pstotal[i] > 0) ? 100.0 * this.pslas[i] / this.pstotal[i] : 0;
        this.psuas[i] = (this.pstotal[i] > 0) ? 100.0 * this.psuas[i] / this.pstotal[i] : 0;
    }
}

function getScores(gTree, sTree)
{
    var i, size = gTree.size();
    var scores = new Score(false);
    var gNode, sNode, nsym;

    for (i=1; i<size; i++)
    {
        gNode = gTree.getNode(i);
        sNode = sTree.getNode(i);
        nsym  = !gNode.isSymbol;

        scores.total += 1;
        if (nsym) scores.ptotal += 1;

        if (gNode.headId == sNode.headId)
        {
            scores.uas += 1;
            if (nsym) scores.puas += 1;

            if (gNode.deprel == sNode.deprel)
            {
                scores.las += 1;
                if (nsym) scores.plas += 1;
            }
        }

        if (gNode.deprel == sNode.deprel)
        {
            scores.ls += 1
            if (nsym) scores.pls += 1;
        }
    }

    // exact match
    scores.exact += 1
    if (scores.total == scores.las) scores.elas += 1
    if (scores.total == scores.uas) scores.euas += 1
    if (scores.total == scores.ls)  scores.els  += 1

    if (scores.ptotal > 0)
    {
        scores.pexact += 1
        if (scores.ptotal == scores.plas) scores.pelas += 1
        if (scores.ptotal == scores.puas) scores.peuas += 1
        if (scores.ptotal == scores.pls)  scores.pels  += 1
    }

    return scores;
}

function evaluateAll()
{
    var i, size = s_scores.length;

    for (i=0; i<size; i++)
    {
        s_scores[i].init(true);
        addScores(g_trees, s_trees[i], s_scores[i]);
        s_scores[i].finalize();
    }

    var space = document.getElementById(CHART_SPACE);
    while (space.firstChild) space.removeChild(space.firstChild);

    // overall
    drawChart(LABELS_ACC, dataOverallTokens, 'column', 'Overall ('+numberWithCommas(s_scores[0].total)+' tokens)');
    drawTable(LABELS_ACC, dataOverallTokens);
    space.appendChild(document.createElement("br"));

    drawChart(LABELS_ACC, dataOverallTokensWithoutSymbols, 'column', 'Overall w/o symbols ('+numberWithCommas(s_scores[0].ptotal)+' tokens)');
    drawTable(LABELS_ACC, dataOverallTokensWithoutSymbols);
    space.appendChild(document.createElement("br"));

    drawChart(LABELS_ACC, dataOverallExact, 'column', 'Exact match ('+numberWithCommas(s_scores[0].exact)+' trees)');
    drawTable(LABELS_ACC, dataOverallExact);
    space.appendChild(document.createElement("br"));

    drawChart(LABELS_ACC, dataOverallExactWithoutSymbols, 'column', 'Exact match w/o symbols ('+numberWithCommas(s_scores[0].pexact)+' trees)');
    drawTable(LABELS_ACC, dataOverallExactWithoutSymbols);
    space.appendChild(document.createElement("br"));

    // by sentence length
    drawChart(LABELS_SEN, dataBySentenceLengthLAS, 'line', 'LAS by sentence length (tokens)');
    drawTable(LABELS_SEN, dataBySentenceLengthLAS, dataBySentenceLengthTotal);
    space.appendChild(document.createElement("br"));

    drawChart(LABELS_SEN, dataBySentenceLengthLASWithoutSymbols, 'line', 'LAS w/o symbols by sentence length (tokens)');
    drawTable(LABELS_SEN, dataBySentenceLengthLASWithoutSymbols, dataBySentenceLengthTotalWithoutSymbols);
    space.appendChild(document.createElement("br"));

    drawChart(LABELS_SEN, dataBySentenceLengthUAS, 'line', 'UAS by sentence length (tokens)');
    drawTable(LABELS_SEN, dataBySentenceLengthUAS, dataBySentenceLengthTotal);
    space.appendChild(document.createElement("br"));

    drawChart(LABELS_SEN, dataBySentenceLengthUASWithoutSymbols, 'line', 'UAS w/o symbols by sentence length (tokens)');
    drawTable(LABELS_SEN, dataBySentenceLengthUASWithoutSymbols, dataBySentenceLengthTotalWithoutSymbols);
    space.appendChild(document.createElement("br"));



}

function addScores(gTrees, sTrees, scores)
{
    var i, size = gTrees.length, tmp, sen;

    for (i=0; i<size; i++)
    {
        tmp = getScores(gTrees[i], sTrees[i]);
        scores.addAll(tmp);

        // by sentence length
        sen = Math.floor((tmp.total - 1) / 10);
        if (sen >= SEN_NUM) sen = SEN_NUM - 1;

        scores.stotal[sen] += tmp.total;
        scores.slas[sen]   += tmp.las;
        scores.suas[sen]   += tmp.uas;

        scores.pstotal[sen] += tmp.ptotal;
        scores.pslas[sen]   += tmp.plas;
        scores.psuas[sen]   += tmp.puas;
    }
}

// ------------------------------------ Chart Overall ------------------------------------

function drawChart(labels, populate, type, title)
{
    var i, size = labels.length, min = 100, tmp, acc;
    var data = [];

    for (i=0; i<size; i++)
        data.push(createChartData(type, labels[i]));

    for (i=0; i<s_scores.length; i++)
    {
        acc = populate(s_scores[i]);

        if (sum(acc) > 0)
        {
            tmp = chartAddDataPoints(data, s_scores[i].name, acc);
            if (tmp > 0) min = Math.min(min, tmp);
        }
    }

    min = Math.floor(min/10) * 10;
    if (min % 10 > 5) min += 5;

    var width = s_scores.length * 120;
    if (width < 300) width = 300;

    var div = document.createElement("div");
    div.style.width  = width.toString()+"px";
    div.style.height = "300px";
    document.getElementById(CHART_SPACE).appendChild(div);

    var chart = new CanvasJS.Chart(div,
    {
      theme: "theme3",
      title:
      {
        text: title
      },
      toolTip:
      {
        shared: true
      },
      axisX:
      {
        lineThickness: 1
      },
      axisY:
      {
        tickThickness: 1,
        lineThickness: 1,
        gridThickness: 0.5,
        minimum: min
      }
    });

    chart.options.data = [];
    for (i=0; i<size; i++)
        chart.options.data.push(data[i]);
    chart.render();
}

function createChartData(chartType, dataName)
{
    var data =
    {
        type: chartType,
        name: dataName,
        showInLegend: true,
        dataPoints: []
    }

    return data;
}

function chartAddDataPoints(data, name, acc)
{
    var i, size = acc.length, min = 100;

    for (i=0; i<size; i++)
    {
        if (acc[i] > 0) min = Math.min(acc[i], min);
        data[i].dataPoints.push({label: name, y: acc[i]});
    }

    return min;
}

// ------------------------------------ Table Overall ------------------------------------

function drawTable(labels, populate, total)
{
    var table = createTable();
    var tr, i, scores;

    // header
    tr = document.createElement('tr');
    table.appendChild(tr);

    tr.appendChild(createTD('center', 'System', TD_WIDTH+20, F0F0F0));

    for (i=0; i<labels.length; i++)
        tr.appendChild(createTD('center', labels[i], TD_WIDTH, F0F0F0));

    // scores
    for (i=0; i<s_scores.length; i++)
    {
        tr = document.createElement('tr');
        table.appendChild(tr);
        scores = s_scores[i];

        tr.appendChild(createTD('center', scores.name, TD_WIDTH+20, WHITE));
        tableAddColumns(tr, populate(scores), WHITE, 2);
    }

    // total
    if (typeof total != 'undefined')
    {
        tr = document.createElement('tr');
        table.appendChild(tr);
        tr.appendChild(createTD('center', 'Total', TD_WIDTH+20, F0F0F0));
        tableAddColumns(tr, total(scores), F0F0F0, 0);
    }

    document.getElementById(CHART_SPACE).appendChild(table);
}

function createTable()
{
    var table = document.createElement('table');

    table.setAttribute('border', 1);
    table.setAttribute('bordercolor', LIGHT_GRAY);
    table.setAttribute('cellPadding', 0);
    table.setAttribute('cellSpacing', 0);

    return table;
}

function createTD(align, text, width, bgcolor)
{
    var td = document.createElement('td');
    td.setAttribute('align', align);
    td.setAttribute('width', width);
    td.setAttribute('bgcolor', bgcolor);
    td.appendChild(document.createTextNode(text));
    return td;
}

function tableAddColumns(tr, acc, color, prec)
{
    var i, size = acc.length;

    for (i=0; i<size; i++)
        tr.appendChild(createTD('center', acc[i].toFixed(prec), TD_WIDTH, color));
}

// ------------------------------------ Data ------------------------------------

function dataOverallTokens(scores)
{
    return [scores.las, scores.uas, scores.ls];
}

function dataOverallTokensWithoutSymbols(scores)
{
    return [scores.plas, scores.puas, scores.pls];
}

function dataOverallExact(scores)
{
    return [scores.elas, scores.euas, scores.els];
}

function dataOverallExactWithoutSymbols(scores)
{
    return [scores.pelas, scores.peuas, scores.pels];
}

function dataBySentenceLengthLAS(scores)
{
    return scores.slas;
}

function dataBySentenceLengthUAS(scores)
{
    return scores.suas;
}

function dataBySentenceLengthLASWithoutSymbols(scores)
{
    return scores.pslas;
}

function dataBySentenceLengthUASWithoutSymbols(scores)
{
    return scores.psuas;
}

function dataBySentenceLengthTotal(scores)
{
    return scores.stotal;
}

function dataBySentenceLengthTotalWithoutSymbols(scores)
{
    return scores.pstotal;
}
-->
