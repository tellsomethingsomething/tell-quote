import { Page, Text, View } from '@react-pdf/renderer';
import { DEPARTMENTS } from '../../../store/callSheetStore';
import { styles } from './callSheetStyles';
import { groupCrewByDepartment } from './callSheetHelpers';
import PDFHeader from './PDFHeader';
import PDFFooter from './PDFFooter';

/**
 * Page 2 - Crew List
 */
export default function CrewPage({ sheet, crew, companyName }) {
    const crewByDept = groupCrewByDepartment(crew);

    return (
        <Page size="A4" style={styles.page}>
            <PDFHeader sheet={sheet} pageTitle="Crew List" />

            <View style={styles.content}>
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Crew ({crew.length} total)</Text>
                    </View>

                    {DEPARTMENTS.map(dept => {
                        const deptCrew = crewByDept[dept.id];
                        if (!deptCrew || deptCrew.length === 0) return null;

                        return (
                            <View key={dept.id}>
                                <View style={styles.crewDeptHeader}>
                                    <View style={[styles.crewDeptDot, { backgroundColor: dept.color }]} />
                                    <Text style={styles.crewDeptName}>{dept.name} ({deptCrew.length})</Text>
                                </View>
                                <View style={styles.crewTable}>
                                    {deptCrew.map((member, idx) => (
                                        <View key={member.id || idx} style={styles.crewRow}>
                                            <Text style={styles.crewName}>{member.name}</Text>
                                            <Text style={styles.crewRole}>{member.roleTitle}</Text>
                                            <Text style={styles.crewCall}>{member.callTime || '-'}</Text>
                                            <Text style={styles.crewPhone}>{member.phone || ''}</Text>
                                            <View style={styles.crewConfirmed}>
                                                {member.confirmed && (
                                                    <Text style={styles.confirmedBadge}>✓</Text>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        );
                    })}

                    {/* Other/Unassigned */}
                    {crewByDept['other'] && crewByDept['other'].length > 0 && (
                        <View>
                            <View style={styles.crewDeptHeader}>
                                <View style={[styles.crewDeptDot, { backgroundColor: '#64748B' }]} />
                                <Text style={styles.crewDeptName}>Other ({crewByDept['other'].length})</Text>
                            </View>
                            <View style={styles.crewTable}>
                                {crewByDept['other'].map((member, idx) => (
                                    <View key={member.id || idx} style={styles.crewRow}>
                                        <Text style={styles.crewName}>{member.name}</Text>
                                        <Text style={styles.crewRole}>{member.roleTitle}</Text>
                                        <Text style={styles.crewCall}>{member.callTime || '-'}</Text>
                                        <Text style={styles.crewPhone}>{member.phone || ''}</Text>
                                        <View style={styles.crewConfirmed}>
                                            {member.confirmed && (
                                                <Text style={styles.confirmedBadge}>✓</Text>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* Footer */}
            <PDFFooter companyName={companyName} version={sheet.version} pageNumber={2} />
        </Page>
    );
}
