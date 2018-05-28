import { Router } from 'express';
import logger from 'tools/logger';
import { exportedSchema } from 'project_server/utils/dependencies';
import XLSX from 'xlsx-style';
import moment from 'moment';
import { sheetToFeatures, utils } from 'project_modules/xlsx';
const { debug, errDebug, time } = logger('uploadXlsxFeatures.router');
const router = Router();
const orderWeight = 90;

function prepFeatures(rows, mergeSchema) {
  return Object.keys(rows).map(rowKey => {
    const row = rows[rowKey];
    let o1 = {
      props: { objectType: mergeSchema.objectType },
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(row['у']), parseFloat(row['х'])],
      },
      properties: {},
    };
    Object.keys(mergeSchema.propertiesFields).forEach(property => {
      if (
        row[mergeSchema.propertiesFields[property]] &&
        (property === 'datazaklyucheniyadogovora' ||
          property === 'dataistecheniyadogovora')
      ) {
        const dd = row[mergeSchema.propertiesFields[property]];
        console.log('-----------------dd', row, dd);
        const d = moment(dd, 'DD.MM.YYYY');
        if (d.isValid()) {
          o1.properties[property] = d.toISOString();
        }
        console.log(
          d.isValid(),
          row[mergeSchema.propertiesFields[property]],
          o1.properties[property],
          d.toISOString()
        );
      } else {
        o1.properties[property] =
          row[mergeSchema.propertiesFields[property]];
      }
    });
    return o1;
  });
}

router.get('/:layerName', (req, res) => {
  // TODO upload file
  const done = time(
    'parsing xlsx, add features to layer',
    req.params.layerName
  );
  const { xlsxFilePath, sheetName, headersValidateFoo } = {
    xlsxFilePath: 'server/data/nto.xlsx',
    sheetName: 'Лист2',
    headersValidateFoo: utils.validateKeys,
  };
  const workbook = XLSX.readFile(xlsxFilePath);
  const sheet = workbook.Sheets[sheetName];
  const rows = sheetToFeatures(sheet, headersValidateFoo);

  const mergeSchema = {
    objectType: 'fiv',
    propertiesFields: {
      nalichievshemento: 'Порядковый номер из утверждённой схемы НТО',
      opisaniemestopolozheniya: 'описание местоположения',
      kratkoeopisaniedeyatelnosti: 'Краткое описание деятельности',
      ploschadkvm: 'Площадь кв.м.',
      zemelniiuchastok: 'Земельный кчасток',
      viddeyatelnosti: 'Вид деятельности',
      naimenovanieosuschestvlyayuschegodeyatelnost:
        'Наименование осуществляющего деятельность',
      datazaklyucheniyadogovora: 'Дата заключения договора',
      nomerdogovora: 'Номер договора',
      dataistecheniyadogovora: 'Дата истечения договора',
      raion: 'район',
    },
  };

  const features = prepFeatures(rows, mergeSchema);

  async function layerFeaturesSubstitution(features, layerName) {
    const layer = await exportedSchema.models.Layers.findOne({
      where: { name: layerName },
    });
    // WARNING!!
    const destroyed = await exportedSchema.models.Features.destroy({
      where: { LayerName: layerName },
    });
    debug('features destroyed', destroyed);

    const featureCreatePromises = features.map(feature =>
      exportedSchema.models.Features.create(feature)
    );
    const featureDocs = await Promise.all(featureCreatePromises);
    debug('features created', featureDocs.length);
    await layer.addFeatures(featureDocs);
    debug('features added to layer', layerName);
    res.json({ result: 'ok' });
  }
  layerFeaturesSubstitution(features, 'primersloi1'); // res.params.layerName);
});

export default {
  route: '/layers/upload-xlsx-features',
  router,
  orderWeight,
};
