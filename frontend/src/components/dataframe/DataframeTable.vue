<script setup>
import { onMounted, ref, computed } from 'vue'
import * as Xlsx from 'xlsx'
import { saveAs } from 'file-saver'

const dummyData = [
  {
    patient_id: 'P001',
    name: 'Alice Kim',
    age: 32,
    visit_date: '2025-08-01',
    blood_pressure: '120/80',
    notes: 'Follow-up needed',
  },
  {
    patient_id: 'P002',
    name: 'Bob Lee',
    age: 45,
    visit_date: '2025-08-02',
    blood_pressure: '130/85',
    notes: 'Normal range',
  },
  {
    patient_id: 'P003',
    name: 'Charlie Park',
    age: 29,
    visit_date: '2025-08-03',
    blood_pressure: '110/75',
    notes: 'Slightly low BP',
  },
  {
    patient_id: 'P004',
    name: 'Daisy Choi',
    age: 53,
    visit_date: '2025-08-04',
    blood_pressure: '140/90',
    notes: 'High BP detected',
  },
  {
    patient_id: 'P005',
    name: 'Evan Kang',
    age: 40,
    visit_date: '2025-08-05',
    blood_pressure: '125/80',
    notes: 'Stable condition',
  },
]

const data = ref(dummyData)

// 필터 상태: { columnName: [선택값,...] }
const filters = ref({})

// 열려있는 필터 모달 컬럼명(null이면 모달 닫힘)
const activeFilterColumn = ref(null)

// 열 목록
const columns = Object.keys(dummyData[0])

// 각 컬럼별 고유 값 배열 (필터 체크박스 목록)
const uniqueValues = {}
columns.forEach((col) => {
  uniqueValues[col] = [...new Set(dummyData.map((item) => item[col]))]
})

// 필터링된 데이터
const filteredData = computed(() => {
  return data.value.filter((row) =>
    columns.every((col) => {
      const selected = filters.value[col]
      if (!selected || selected.length === 0) return true
      return selected.includes(row[col])
    }),
  )
})

// 정렬
const sortColumn = (colName, order) => {
  const tempData = [...filteredData.value]
  tempData.sort((a, b) => {
    if (a[colName] < b[colName]) return order === 'asc' ? -1 : 1
    if (a[colName] > b[colName]) return order === 'asc' ? 1 : -1
    return 0
  })
  data.value = tempData
}

// 셀 편집
const editingCell = ref({ rowIndex: null, key: null })
const enableEdit = (rowIndex, key) => {
  editingCell.value = { rowIndex, key }
}
const saveEdit = (event, rowIndex, key) => {
  data.value[rowIndex][key] = event.target.value
  editingCell.value = { rowIndex: null, key: null }
}
const onKeyUp = (event, rowIndex, key) => {
  if (event.key === 'Enter') saveEdit(event, rowIndex, key)
}

// 선택 행 삭제
const selectedRows = ref([])
const selectRow = (rowIndex) => {
  const temp = [...selectedRows.value]
  const idx = temp.indexOf(rowIndex)
  if (idx === -1) temp.push(rowIndex)
  else temp.splice(idx, 1)
  selectedRows.value = temp
}
const deleteRow = () => {
  data.value = data.value.filter((_, index) => !selectedRows.value.includes(index))
  selectedRows.value = []
}

// 엑셀 다운로드
const exportToExcel = () => {
  const worksheet = Xlsx.utils.json_to_sheet(data.value)
  const workbook = Xlsx.utils.book_new()
  Xlsx.utils.book_append_sheet(workbook, worksheet, 'sheet1')
  const wbout = Xlsx.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/object-stream' })
  saveAs(blob, 'test.xlsx')
}
// 엑셀 업로드
const fileInput = ref(null)
const importExcel = (event) => {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataArr = new Uint8Array(e.target.result)
    const workbook = Xlsx.read(dataArr, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const jsonData = Xlsx.utils.sheet_to_json(worksheet, { defval: '' })
    data.value = jsonData
    selectedRows.value = []
    editingCell.value = { rowIndex: null, key: null }
    filters.value = {} // 필터 초기화
  }
  reader.readAsArrayBuffer(file)
}
const triggerFileSelect = () => {
  if (confirm('저장된 데이터가 엑셀데이터로 변경됩니다. 진행하시겠습니까?')) {
    fileInput.value && fileInput.value.click()
  }
}

// 컬럼 너비 리사이즈
const columnWidths = ref([])
onMounted(() => {
  if (data.value.length > 0) {
    columnWidths.value = columns.map(() => 120)
  }
})
let startX = 0
let startWidth = 0
let draggingColumnIndex = -1
const onMouseDown = (event, index) => {
  draggingColumnIndex = index
  startX = event.clientX
  startWidth = columnWidths.value[index]
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}
const onMouseMove = (event) => {
  if (draggingColumnIndex === -1) return
  const diffX = event.clientX - startX
  const newWidth = startWidth + diffX
  if (newWidth > 50) columnWidths.value[draggingColumnIndex] = newWidth
}
const onMouseUp = () => {
  draggingColumnIndex = -1
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

// 필터 모달 토글
const toggleFilter = (col) => {
  activeFilterColumn.value = activeFilterColumn.value === col ? null : col
}

// 체크박스 토글
const toggleFilterValue = (col, val) => {
  if (!filters.value[col]) filters.value[col] = []
  const idx = filters.value[col].indexOf(val)
  if (idx === -1) filters.value[col].push(val)
  else filters.value[col].splice(idx, 1)
}

// 필터 모달 닫기 (모달 밖 클릭용)
const closeFilter = () => {
  activeFilterColumn.value = null
}
</script>

<template>
  <div>
    <p>
      선택된 행 : <span v-for="value in selectedRows" :key="value">{{ value + 1 }}&nbsp;</span>
      <button @click="deleteRow">삭제</button>
    </p>
    <div>
      <button @click="exportToExcel">엑셀 내려받기</button>
      <button @click="triggerFileSelect">엑셀 올리기</button>
      <input
        ref="fileInput"
        type="file"
        accept=".xlsx,.xls"
        @change="importExcel"
        style="display: none"
      />
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 60px">선택</th>
        <th
          v-for="(key, index) in columns"
          :key="key"
          :style="{ width: columnWidths[index] + 'px', position: 'relative' }"
        >
          <div style="display: flex; align-items: center; justify-content: center; gap: 5px">
            <span>{{ key }}</span>
            <div class="sort-btn-section">
              <button class="cell-btn" @click="sortColumn(key, 'asc')">
                <i class="material-icons">arrow_drop_up</i>
              </button>
              <button class="cell-btn" @click="sortColumn(key, 'desc')">
                <i class="material-icons">arrow_drop_down</i>
              </button>
            </div>
            <button class="cell-btn" @click="toggleFilter(key)">
              <i class="material-icons">filter_alt</i>
            </button>
          </div>

          <!-- 필터 모달 -->
          <div v-if="activeFilterColumn === key" class="filter-modal" @click.self="closeFilter">
            <div class="filter-content">
              <div v-for="val in uniqueValues[key]" :key="val">
                <label>
                  <input
                    type="checkbox"
                    :checked="filters[key]?.includes(val)"
                    @change="toggleFilterValue(key, val)"
                  />
                  {{ val }}
                </label>
              </div>
              <button @click="closeFilter">닫기</button>
            </div>
          </div>

          <div class="resize-handle" @mousedown.prevent="onMouseDown($event, index)"></div>
        </th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="(row, rowIndex) in filteredData" :key="rowIndex">
        <td style="text-align: center">
          <input
            type="checkbox"
            :checked="selectedRows.includes(rowIndex)"
            @change="selectRow(rowIndex)"
          />
        </td>
        <td
          v-for="(key, colIndex) in columns"
          :key="colIndex"
          @dblclick="enableEdit(rowIndex, key)"
          :style="{ width: columnWidths[colIndex] + 'px' }"
        >
          <template v-if="editingCell.rowIndex === rowIndex && editingCell.key === key">
            <input
              type="text"
              :value="row[key]"
              @blur="saveEdit($event, rowIndex, key)"
              @keyup="onKeyUp($event, rowIndex, key)"
              autofocus
            />
          </template>
          <template v-else>
            <span class="data-value">{{ row[key] }}</span>
          </template>
        </td>
      </tr>
      <tr v-if="filteredData.length === 0">
        <td :colspan="columns.length + 1" style="text-align: center; color: #888">
          필터에 맞는 데이터가 없습니다.
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
table {
  border-collapse: collapse;
  border: 1px solid black;
  width: 100%;
  table-layout: fixed;
}
table th,
td {
  border: 1px solid black;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.data-value {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
table th {
  padding: 0 10px;
  height: 50px;
  position: relative;
}
table th > div {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
}
.sort-btn-section {
  display: flex;
  flex-direction: column;
}
.cell-btn {
  background: none;
  border: none;
  margin: 0;
  padding: 0;
  cursor: pointer;
}

.material-icons {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  white-space: nowrap;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: 'liga';
}

.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  height: 100%;
  cursor: col-resize;
}
.resize-handle:hover {
  background-color: #c3c3c3;
}

.filter-modal {
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  padding: 8px;
  top: 100%;
  left: 0;
  z-index: 10;
  width: 180px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.filter-content {
  max-height: 200px;
  overflow-y: auto;
}

.filter-content label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  margin-bottom: 6px;
}

.filter-content button {
  margin-top: 10px;
  width: 100%;
  cursor: pointer;
}
</style>
