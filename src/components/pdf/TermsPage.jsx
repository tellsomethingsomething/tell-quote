import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const colors = {
    white: '#FFFFFF',
    offWhite: '#F8FAFC',
    slate: '#1E293B',
    slateMedium: '#334155',
    slateLight: '#64748B',
    teal: '#0F8B8D',
    border: '#E2E8F0',
};

const styles = StyleSheet.create({
    page: {
        backgroundColor: colors.white,
        paddingTop: 30,
        paddingBottom: 40,
        paddingHorizontal: 30,
        fontFamily: 'Helvetica',
        color: colors.slate,
        fontSize: 6,
    },
    header: {
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: 10,
        color: colors.slate,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    company: {
        fontSize: 7,
        color: colors.teal,
        marginBottom: 1,
    },
    address: {
        fontSize: 6,
        color: colors.slateLight,
    },
    intro: {
        fontSize: 5.5,
        color: colors.slateMedium,
        marginBottom: 10,
        lineHeight: 1.4,
    },
    columnsContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    column: {
        flex: 1,
    },
    section: {
        marginBottom: 6,
    },
    sectionTitle: {
        fontSize: 6.5,
        color: colors.slate,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 2,
    },
    subsectionTitle: {
        fontSize: 6,
        color: colors.slateMedium,
        fontFamily: 'Helvetica-Bold',
        marginTop: 2,
        marginBottom: 1,
    },
    text: {
        fontSize: 5.5,
        color: colors.slateMedium,
        lineHeight: 1.35,
        textAlign: 'justify',
    },
    listItem: {
        fontSize: 5.5,
        color: colors.slateMedium,
        lineHeight: 1.35,
        marginLeft: 6,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.white,
    },
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerLogo: {
        fontSize: 8,
        color: colors.slate,
        letterSpacing: 2,
        marginRight: 6,
    },
    footerDivider: {
        width: 1,
        height: 8,
        backgroundColor: colors.border,
        marginRight: 6,
    },
    footerText: {
        fontSize: 6,
        color: colors.slateLight,
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerQuote: {
        fontSize: 6,
        color: colors.teal,
    },
    footerPageNum: {
        fontSize: 6,
        color: colors.slateLight,
        marginLeft: 10,
    },
});

export default function TermsPage({ quoteNumber, companyWebsite }) {
    return (
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>General Terms and Conditions</Text>
                <Text style={styles.company}>TELL PRODUCTIONS SDN BHD</Text>
                <Text style={styles.address}>8-3, Jalan Jalil 1, Bukit Jalil, 57000 Kuala Lumpur, Malaysia</Text>
            </View>

            <Text style={styles.intro}>
                These General Terms and Conditions ("Terms") apply to all services provided by Tell Productions Sdn Bhd ("the Company", "we", "us", "our") to any client ("the Client", "you", "your"). By engaging our services, you agree to be bound by these Terms.
            </Text>

            <View style={styles.columnsContainer}>
                {/* Column 1 */}
                <View style={styles.column}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>1. DEFINITIONS</Text>
                        <Text style={styles.text}>
                            "Agreement" means the contract formed between the Company and the Client comprising any quotation, proposal, statement of work, and these Terms; "Deliverables" means any tangible outputs provided to the Client including but not limited to broadcast feeds, recordings, graphics, and technical documentation; "Equipment" means all technical equipment, hardware, software, and infrastructure provided or operated by the Company; "Event" means the sporting event, broadcast, live production, or other activity for which Services are provided; "Fees" means all charges payable by the Client for the Services as set out in any quotation or statement of work; "Footage" means all video, audio, graphics, and visual content captured, created, or produced by the Company; "Services" means the event delivery, technical services, broadcast services, streaming, graphics, presentation, and related services provided by the Company.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>2. SERVICES</Text>
                        <Text style={styles.subsectionTitle}>2.1 Scope</Text>
                        <Text style={styles.text}>
                            The Company shall provide the Services as described in the relevant quotation or statement of work. Services may include event delivery, outside broadcast, live streaming, graphics operation, vision mixing, audio, presentation services, and technical crew provision. Any services not expressly included are excluded and require separate agreement.
                        </Text>
                        <Text style={styles.subsectionTitle}>2.2 Professional Standards</Text>
                        <Text style={styles.text}>
                            The Company shall perform the Services with reasonable skill and care in accordance with generally accepted industry standards for professional broadcast and event technical services.
                        </Text>
                        <Text style={styles.subsectionTitle}>2.3 Technical Standards</Text>
                        <Text style={styles.text}>
                            Unless otherwise specified, technical deliverables shall comply with: (a) EBU R128 loudness standards where applicable; (b) minimum HD resolution (1920×1080); and (c) industry-standard formats appropriate for the delivery method.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>3. CLIENT OBLIGATIONS</Text>
                        <Text style={styles.text}>
                            The Client shall: provide accurate and complete information regarding the Event and requirements; ensure appropriate venue access, power supply, internet connectivity, and working conditions for the Company's personnel and Equipment; obtain all necessary rights, licences, permits, and permissions for the Event; provide timely approvals and decisions as reasonably required; ensure safe working conditions and compliance with health and safety requirements; not interfere with or direct the Company's personnel or Equipment without prior agreement. If the Company's performance is delayed or prevented by any act or omission of the Client, the Company shall not be liable for any resulting delay, and the Client shall remain liable for all Fees.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>4. PAYMENT</Text>
                        <Text style={styles.subsectionTitle}>4.1 Payment Schedule</Text>
                        <Text style={styles.text}>
                            Unless otherwise agreed in writing, Fees shall be payable as follows: 50% upon confirmation of booking (non-refundable deposit); 50% prior to the Event date or within fourteen (14) days of invoice, whichever is earlier.
                        </Text>
                        <Text style={styles.subsectionTitle}>4.2 Payment Terms</Text>
                        <Text style={styles.text}>
                            All invoices are payable within thirty (30) days of the invoice date unless otherwise specified. All amounts are exclusive of applicable taxes, which shall be charged in addition where required by law.
                        </Text>
                        <Text style={styles.subsectionTitle}>4.3 Late Payment</Text>
                        <Text style={styles.text}>
                            If any invoice is not paid when due, the Client shall pay interest on the overdue amount at the rate of 1.5% per month (18% per annum) from the due date until payment in full. The Company may suspend Services and withhold Deliverables until all overdue amounts have been paid.
                        </Text>
                        <Text style={styles.subsectionTitle}>4.4 Additional Costs</Text>
                        <Text style={styles.text}>
                            Travel, accommodation, transport, equipment hire, and other expenses shall be charged in addition to the Fees unless expressly included in the quotation. Any additional services requested during the Event shall be charged at the Company's prevailing rates.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>5. INTELLECTUAL PROPERTY AND FOOTAGE</Text>
                        <Text style={styles.subsectionTitle}>5.1 Ownership of Footage</Text>
                        <Text style={styles.text}>
                            All Footage created by the Company remains the exclusive property of the Company. The Company retains all copyright and intellectual property rights in all Footage unless expressly agreed otherwise in writing.
                        </Text>
                        <Text style={styles.subsectionTitle}>5.2 Conditional Licence</Text>
                        <Text style={styles.text}>
                            Subject to full payment of all Fees, the Company grants the Client a non-exclusive licence to use the Deliverables for the purposes specified in the Agreement. This licence is conditional upon payment and shall be automatically revoked if payment is not received in full.
                        </Text>
                        <Text style={styles.subsectionTitle}>5.3 Retention Until Payment</Text>
                        <Text style={styles.text}>
                            Until all Fees have been paid in full: the Company retains full ownership and copyright of all Footage and Deliverables; the Client has no right to use, distribute, broadcast, or exploit any Footage or Deliverables; the Company may withhold delivery of any Footage or Deliverables; and any unauthorised use shall constitute copyright infringement.
                        </Text>
                        <Text style={styles.subsectionTitle}>5.4 Assignment of Rights</Text>
                        <Text style={styles.text}>
                            Transfer or assignment of copyright in Footage to the Client shall only occur if: (a) expressly agreed in writing; (b) specified in the statement of work or quotation; and (c) all Fees have been paid in full. Any such assignment shall be made pursuant to Section 27 of the Copyright Act 1987 (Malaysia).
                        </Text>
                        <Text style={styles.subsectionTitle}>5.5 Company's Rights</Text>
                        <Text style={styles.text}>
                            The Company reserves the right to use Footage for promotional purposes, portfolio display, award submissions, showreels, and case studies, provided such use does not disclose the Client's confidential information.
                        </Text>
                        <Text style={styles.subsectionTitle}>5.6 Company Background IP</Text>
                        <Text style={styles.text}>
                            All pre-existing materials, templates, graphics libraries, software tools, and methodologies owned by the Company remain the Company's exclusive property and are licensed, not assigned, to the Client solely for use within the Deliverables.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>6. EQUIPMENT</Text>
                        <Text style={styles.subsectionTitle}>6.1 Company Equipment</Text>
                        <Text style={styles.text}>
                            Equipment provided by the Company remains the Company's property at all times. The Client shall not move, adjust, or interfere with Equipment without the Company's consent. The Client shall be liable for any damage to or loss of Equipment caused by the Client, its employees, agents, or invitees, excluding fair wear and tear.
                        </Text>
                        <Text style={styles.subsectionTitle}>6.2 Client Equipment</Text>
                        <Text style={styles.text}>
                            Any equipment supplied by the Client shall be at the Client's sole risk. The Company accepts no liability for damage to or loss of Client-supplied equipment except where caused by the Company's gross negligence or wilful misconduct.
                        </Text>
                    </View>
                </View>

                {/* Column 2 */}
                <View style={styles.column}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>7. CANCELLATION AND POSTPONEMENT</Text>
                        <Text style={styles.subsectionTitle}>7.1 Cancellation by Client</Text>
                        <Text style={styles.text}>
                            If the Client cancels the Agreement, the following cancellation fees apply based on notice prior to the Event date: More than 30 days' notice: 25% of total Fees plus costs incurred; 15 to 30 days' notice: 50% of total Fees plus costs incurred; 5 to 14 days' notice: 75% of total Fees plus costs incurred; Less than 5 days' notice: 100% of total Fees plus costs incurred.
                        </Text>
                        <Text style={styles.subsectionTitle}>7.2 Postponement</Text>
                        <Text style={styles.text}>
                            If the Event is postponed, the Company shall use reasonable endeavours to accommodate the new date, subject to availability. The Client shall pay any additional costs for rebooking crew and equipment. If the rescheduled date is more than 60 days from the original date, the cancellation fees in Clause 7.1 shall apply.
                        </Text>
                        <Text style={styles.subsectionTitle}>7.3 Cancellation by Company</Text>
                        <Text style={styles.text}>
                            The Company may cancel the Agreement with immediate effect if the Client fails to pay any amount due or breaches any material term. The Company shall not be liable for any loss resulting from such cancellation.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>8. FORCE MAJEURE</Text>
                        <Text style={styles.text}>
                            Neither Party shall be liable for any failure or delay in performance resulting from circumstances beyond its reasonable control, including: acts of God, natural disasters, pandemic, epidemic, war, terrorism, civil unrest, government action, strikes, failure of utilities or telecommunications, cancellation or postponement of the Event by organisers or governing bodies, extreme weather preventing safe working, travel restrictions, or visa denials affecting key personnel. If a force majeure event continues for more than 60 days, either Party may terminate the Agreement. Upon such termination, the Client shall pay for all Services performed and costs incurred to the date of termination.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>9. LIMITATION OF LIABILITY</Text>
                        <Text style={styles.subsectionTitle}>9.1 Liability Cap</Text>
                        <Text style={styles.text}>
                            The Company's total liability under or in connection with this Agreement shall not exceed the total Fees paid or payable by the Client in the 12 months preceding the claim, or RM 500,000, whichever is greater.
                        </Text>
                        <Text style={styles.subsectionTitle}>9.2 Exclusion of Consequential Loss</Text>
                        <Text style={styles.text}>
                            Neither Party shall be liable for any indirect, special, incidental, or consequential damages, including loss of profits, revenue, business opportunity, or data, whether or not foreseeable.
                        </Text>
                        <Text style={styles.subsectionTitle}>9.3 Exceptions</Text>
                        <Text style={styles.text}>
                            Nothing in these Terms excludes or limits liability for: (a) fraud or wilful misconduct; (b) death or personal injury caused by negligence; or (c) any liability that cannot be limited under applicable law.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>10. CONFIDENTIALITY</Text>
                        <Text style={styles.text}>
                            Each Party shall keep confidential all confidential information of the other Party and shall not disclose such information except as necessary for the performance of the Agreement or as required by law. This obligation shall survive termination of the Agreement for a period of five (5) years.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>11. DATA PROTECTION</Text>
                        <Text style={styles.text}>
                            Each Party shall comply with its obligations under the Personal Data Protection Act 2010 (Malaysia) in connection with any personal data processed under this Agreement. Where personal data is transferred outside Malaysia, the transferring Party shall ensure compliance with applicable data protection requirements.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>12. INSURANCE</Text>
                        <Text style={styles.text}>
                            The Company maintains public liability insurance and equipment insurance appropriate for its operations. Certificates of insurance shall be provided upon request. The Client is responsible for maintaining its own insurance coverage for the Event, including event cancellation insurance where appropriate.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>13. INDEMNITY</Text>
                        <Text style={styles.text}>
                            The Client shall indemnify the Company against all losses, damages, costs, and liabilities arising from: (a) any breach of the Agreement by the Client; (b) any claim that Client-supplied materials infringe third-party rights; (c) any third-party claims arising from the Event; and (d) the Client's unauthorised use of Footage or Deliverables.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>14. TERMINATION</Text>
                        <Text style={styles.text}>
                            Either Party may terminate the Agreement with immediate effect if the other Party: (a) commits a material breach and fails to remedy it within 14 days of written notice; (b) becomes insolvent or bankrupt; or (c) ceases to carry on business. Upon termination, the Client shall pay for all Services performed and costs incurred, and all provisions relating to intellectual property, liability, and confidentiality shall survive.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>15. DISPUTE RESOLUTION</Text>
                        <Text style={styles.text}>
                            Any dispute arising from this Agreement shall first be referred to good faith negotiation between the Parties. If not resolved within 30 days, the dispute shall be finally determined by arbitration administered by the Asian International Arbitration Centre (AIAC) in Kuala Lumpur, Malaysia, in accordance with the AIAC Arbitration Rules. The arbitration shall be conducted in English by a single arbitrator.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>16. GOVERNING LAW</Text>
                        <Text style={styles.text}>
                            This Agreement shall be governed by and construed in accordance with the laws of Malaysia.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>17. GENERAL PROVISIONS</Text>
                        <Text style={styles.text}>
                            17.1 Entire Agreement: These Terms, together with any quotation or statement of work, constitute the entire agreement between the Parties and supersede all prior agreements and understandings.{'\n'}
                            17.2 Amendment: No amendment to these Terms shall be effective unless agreed in writing by both Parties.{'\n'}
                            17.3 Assignment: The Client shall not assign or transfer any rights under this Agreement without the Company's prior written consent. The Company may subcontract its obligations with notice to the Client.{'\n'}
                            17.4 Severability: If any provision of these Terms is held invalid or unenforceable, it shall be modified to the minimum extent necessary or severed, and the remaining provisions shall continue in full force.{'\n'}
                            17.5 Waiver: No failure or delay in exercising any right shall operate as a waiver. A waiver shall only be effective if in writing.{'\n'}
                            17.6 Notices: Notices shall be in writing and delivered by hand, registered post, or email to the addresses specified in the quotation or statement of work.
                        </Text>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer} fixed>
                <View style={styles.footerContent}>
                    <View style={styles.footerLeft}>
                        <Text style={styles.footerLogo}>TELL</Text>
                        <View style={styles.footerDivider} />
                        <Text style={styles.footerText}>{companyWebsite || 'www.tell.so'}</Text>
                    </View>
                    <View style={styles.footerRight}>
                        <Text style={styles.footerQuote}>{quoteNumber}</Text>
                        <Text render={({ pageNumber, totalPages }) =>
                            `Page ${pageNumber} of ${totalPages}`
                        } style={styles.footerPageNum} />
                    </View>
                </View>
            </View>
        </Page>
    );
}
