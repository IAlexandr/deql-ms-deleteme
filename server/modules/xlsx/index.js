import cellStyles from './cell-style-templates';
import moment from 'moment';
export { default as utils } from './utils';

const alphabet = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

function prepRef(c, r) {
  return 'A1:' + prepIndexLetters(c - 1) + r;
}

export function prepIndexLetters(i) {
  function prepLetters(i, resultLetters = []) {
    const letterCount = Math.ceil(i / 25);
    const letterIndex = Math.ceil(letterCount / 26) - 1;
    if (letterCount > 1) {
      // Мало вероятно, что
      resultLetters.push(alphabet[letterIndex]);
      resultLetters = prepLetters(i - 26, resultLetters);
    } else {
      resultLetters = [alphabet[i]].concat(resultLetters);
    }
    return resultLetters;
  }

  return prepLetters(i)
    .reverse()
    .join('');
}

function prepHeaderRow(fields, headerStyle) {
  const headers = {};
  fields.forEach((field, i) => {
    const letters = prepIndexLetters(i);
    headers[letters + '1'] = {
      v: field.alias || field.name,
      s: headerStyle,
      i,
      letters,
      name: field.name,
    };
  });
  return headers;
}

function preparingFeatureField(fields, fieldName, value) {
  const fieldInfo = fields[fieldName];
  if (
    fields.hasOwnProperty(fieldName) &&
    fieldInfo.hasOwnProperty('preparing')
  ) {
    switch (fieldInfo.preparing.type) {
    case 'datetime':
      let v = moment(value).format('dd.mm.yyyy MM:HH:SS');
      if (fieldInfo.preparing.hasOWnProperty('format')) {
        v = moment(value).format(fieldInfo.preparing.format);
      }
      return v;
    default:
      return value;
    }
  } else {
    return value;
  }
}

export function featuresInfoToSheet(
  featuresInfo,
  headerStyle = cellStyles.header1,
  bodyStyle = cellStyles.body1
) {
  const columns = featuresInfo.fields.length;
  const rows = featuresInfo.features.length;
  let sheet = {
    '!cols': [],
    '!ref': prepRef(columns, rows), // TODO FAIL add columns - 1
  };

  const fields = featuresInfo.fields.filter(
    field => field.name !== featuresInfo.objectIdFieldName
  );
  const headers = prepHeaderRow(fields, headerStyle);
  const headersArray = Object.keys(headers).map(key => headers[key]);
  headersArray.forEach(header => {
    sheet[header.letters + '1'] = { v: header.v, s: header.s, t: 's' };
  });
  featuresInfo.features.map((feature, i) => {
    headersArray.forEach(header => {
      sheet[header.letters + (i + 2)] = {
        v:
          preparingFeatureField(
            featuresInfo.fields,
            header.name,
            feature.properties[header.name]
          ) || 'Нет данных',
        s: bodyStyle,
        t: 's',
      };
    });
  });
  return sheet;
}

export function featuresToWorkBook({
  featuresInfo,
  sheetName,
  headerStyle,
  bodyStyle,
}) {
  const sheet = featuresInfoToSheet(featuresInfo, headerStyle, bodyStyle);
  return {
    Sheets: { [sheetName]: sheet },
    SheetNames: [sheetName],
  };
}

function decode_col(c) {
  let d = 0,
    i = 0;
  for (; i !== c.length; ++i) d = 26 * d + c.charCodeAt(i) - 64;
  return d - 1;
}

function split_cell(cstr) {
  return cstr.replace(/(\$?[A-Z]*)(\$?[0-9]*)/, '$1,$2').split(',');
}
function decode_row(rowstr) {
  return Number(rowstr) - 1;
}
function decode_cell(cstr) {
  let splt = split_cell(cstr);
  return { c: decode_col(splt[0]), r: decode_row(splt[1]) };
}

function extractRef(sheet) {
  const ref = sheet['!ref'].split(':').map(decode_cell);
  delete sheet['!ref'];
  return { s: ref[0], e: ref[1] };
}

function extractHeaders(sheet, { s, e }, headersValidateFoo) {
  const colStart = s.c;
  const colEnd = e.c;
  const keys = Object.keys(sheet);
  const headers = {};
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const [letter] = split_cell(k);
    if (i <= colEnd) {
      headers[letter] = headersValidateFoo(sheet[k].v);
      delete sheet[k];
    } else {
      break;
    }
  }

  return { headers, sheet };
}

export function sheetToFeatures(sheet, headersValidateFoo = k => k) {
  const { s, e } = extractRef(sheet);
  const results = {};
  const { headers, sheet: sheetBody } = extractHeaders(
    sheet,
    { s, e },
    headersValidateFoo
  );

  Object.keys(sheetBody).forEach(addressOfCell => {
    const cellValue = sheet[addressOfCell].v;
    const [letter, rowIndex] = split_cell(addressOfCell);
    const haederName = headers[letter];
    if (!results.hasOwnProperty(rowIndex)) {
      results[rowIndex] = {};
    }
    results[rowIndex][haederName] = cellValue;
  });
  return results;
}
