import excel from 'exceljs'
import { generateFileName } from './generateFileName.js'

const convertToExcel = async (dataArr) => {
    const workbook = new excel.Workbook()

    const worksheet = workbook.addWorksheet('Машины')

    worksheet.columns = [
        {header: 'Номер лота', key: 'lotNumber', width: 30},
        {header: 'Название', key: 'lotName', width: 30},
        {header: 'Год', key: 'lotYear', width: 30},
        {header: 'Начальная цена', key: 'startPrice', width: 30},
        {header: 'Минимальная цена', key: 'minPrice', width: 30},
        {header: 'Гарантийка', key: 'garantPrice', width: 30},
        {header: 'Балансодержатель', key: 'owner', width: 100},
        {header: 'Вин кузова', key: 'bodyNumber', width: 30},
        {header: 'Ссылка', key: 'lotLink', width: 20}
    ]

    const sortedArr = dataArr.sort((a, b) => {
        if (a.owner < b.owner) return -1;
        if (a.owner > b.owner) return 1;
        return 0;
    });

    sortedArr.forEach((row) => {
        worksheet.addRow(row)
    })

    await workbook.xlsx.writeFile(`машины_${generateFileName()}.xls`)
}

export default convertToExcel