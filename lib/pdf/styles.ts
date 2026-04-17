import { StyleSheet } from '@react-pdf/renderer'
import { getFontFamily } from './font-loader'

export const PAGE_MARGIN = 72 // 2.5cm in points (1 inch = 72 points, 2.5cm ≈ 72pt)
export const PAGE_SIZE = 'A4'

export const createStyles = () => StyleSheet.create({
  page: {
    fontFamily: getFontFamily(),
    fontSize: 12,
    lineHeight: 1.15,
    padding: PAGE_MARGIN,
    paddingTop: PAGE_MARGIN,
    paddingBottom: PAGE_MARGIN,
  },
  
  // Cover page styles
  coverPage: {
    fontFamily: getFontFamily(),
    padding: PAGE_MARGIN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  coverSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  coverLogo: {
    width: 150,
    height: 'auto',
    marginBottom: 30,
  },
  coverSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  coverSectionContent: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 15,
  },
  coverFooter: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
  },
  
  // Body styles
  header: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  questionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  
  body: {
    fontSize: 12,
    lineHeight: 1.15,
    textAlign: 'justify',
  },
  
  paragraph: {
    fontSize: 12,
    lineHeight: 1.15,
    textAlign: 'justify',
    marginBottom: 10,
  },
  
  italicText: {
    fontStyle: 'italic',
  },
  
  boldText: {
    fontWeight: 'bold',
  },
  
  // References styles
  referenceSection: {
    marginTop: 20,
  },
  referenceHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  referenceItem: {
    fontSize: 11,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  referenceTitle: {
    fontStyle: 'italic',
  },
  
  // Discussion template specific
  opening: {
    fontSize: 12,
    marginBottom: 15,
  },
  
  closing: {
    fontSize: 12,
    marginTop: 15,
  },
  
  // Soal list styles
  soalListHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  soalItem: {
    fontSize: 12,
    marginBottom: 10,
  },
  soalNumber: {
    fontWeight: 'bold',
  },
  
  // Footer styles
  footer: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666666',
  },
})

export const formatDateIndonesian = (date: Date): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}