// Quote calculations utilities

// Calculate total for a single line item
export function calculateLineTotal(item) {
    if (!item) return { totalCost: 0, totalCharge: 0 };

    const quantity = Number(item.quantity) || 1;
    const days = Number(item.days) || 1;
    const cost = Number(item.cost) || 0;
    const charge = Number(item.charge) || 0;

    return {
        totalCost: cost * quantity * days,
        totalCharge: charge * quantity * days,
    };
}

// Calculate margin percentage
// Returns null if margin is undefined (charge is 0 but cost is non-zero)
export function calculateMargin(cost, charge) {
    const numCost = Number(cost) || 0;
    const numCharge = Number(charge) || 0;

    // If both are zero, margin is 0% (no profit, no loss)
    if (numCharge === 0 && numCost === 0) return 0;

    // If charge is 0 but cost is non-zero, margin is undefined (complete loss)
    if (numCharge === 0) return null;

    return ((numCharge - numCost) / numCharge) * 100;
}

// Calculate margin for a line item
export function calculateLineMargin(item) {
    if (!item) return 0;
    const { totalCost, totalCharge } = calculateLineTotal(item);
    return calculateMargin(totalCost, totalCharge);
}

// Get margin color class based on percentage
// Returns error color for null (undefined margin - complete loss)
export function getMarginColor(margin) {
    if (margin === null) return 'text-red-500'; // Error state: complete loss
    if (margin >= 30) return 'text-green-400';
    if (margin >= 20) return 'text-amber-400';
    return 'text-red-400';
}

// Get margin background class based on percentage
// Returns error color for null (undefined margin - complete loss)
export function getMarginBgColor(margin) {
    if (margin === null) return 'bg-red-500/10'; // Error state: complete loss
    if (margin >= 30) return 'bg-green-400/10';
    if (margin >= 20) return 'bg-amber-400/10';
    return 'bg-red-400/10';
}

// Calculate subsection totals
export function calculateSubsectionTotal(items) {
    if (!items || !Array.isArray(items)) return { totalCost: 0, totalCharge: 0 };

    return items.reduce(
        (acc, item) => {
            if (!item) return acc;
            const { totalCost, totalCharge } = calculateLineTotal(item);
            return {
                totalCost: acc.totalCost + totalCost,
                totalCharge: acc.totalCharge + totalCharge,
            };
        },
        { totalCost: 0, totalCharge: 0 }
    );
}

// Calculate section totals
export function calculateSectionTotal(subsections) {
    if (!subsections || typeof subsections !== 'object') return { totalCost: 0, totalCharge: 0 };

    let totalCost = 0;
    let totalCharge = 0;

    Object.values(subsections).forEach(items => {
        const subsectionTotal = calculateSubsectionTotal(items);
        totalCost += subsectionTotal.totalCost;
        totalCharge += subsectionTotal.totalCharge;
    });

    return { totalCost, totalCharge };
}

// Calculate grand total across all sections
export function calculateGrandTotal(sections) {
    if (!sections || typeof sections !== 'object') return { totalCost: 0, totalCharge: 0 };

    let totalCost = 0;
    let totalCharge = 0;

    Object.values(sections).forEach(section => {
        if (section?.subsections) {
            const sectionTotal = calculateSectionTotal(section.subsections);
            totalCost += sectionTotal.totalCost;
            totalCharge += sectionTotal.totalCharge;
        }
    });

    return { totalCost, totalCharge };
}

// Calculate grand total with fees applied
// Management % and Commission % are added to the charge (built into prices)
// Discount % is subtracted from the final total
export function calculateGrandTotalWithFees(sections, fees = {}) {
    const baseTotal = calculateGrandTotal(sections);

    const managementFee = fees.managementFee || 0;
    const commissionFee = fees.commissionFee || 0;
    const discount = fees.discount || 0;

    // Calculate fee amounts (as percentage of base charge)
    const managementAmount = (baseTotal.totalCharge * managementFee) / 100;
    const commissionAmount = (baseTotal.totalCharge * commissionFee) / 100;

    // Subtotal after adding fees
    const chargeWithFees = baseTotal.totalCharge + managementAmount + commissionAmount;

    // Apply discount to final
    const discountAmount = (chargeWithFees * discount) / 100;
    const finalCharge = chargeWithFees - discountAmount;

    // Cost stays the same (fees don't affect cost)
    const finalCost = baseTotal.totalCost;

    return {
        baseCost: baseTotal.totalCost,
        baseCharge: baseTotal.totalCharge,
        managementAmount,
        commissionAmount,
        chargeWithFees,
        discountAmount,
        totalCost: finalCost,
        totalCharge: finalCharge,
        profit: finalCharge - finalCost,
        margin: finalCharge > 0 ? ((finalCharge - finalCost) / finalCharge) * 100 : 0,

        // Helper to get distributed rate for display
        getDistributedRate: (originalRate) => {
            if (!fees.distributeFees) return originalRate;
            const totalFeePercent = (managementFee + commissionFee);
            return originalRate * (1 + totalFeePercent / 100);
        }
    };
}

// Calculate totals with percentage items (like contingency)
export function calculateTotalWithPercentages(sections, percentageItems) {
    const baseTotal = calculateGrandTotal(sections);

    let additionalCost = 0;
    let additionalCharge = 0;

    percentageItems.forEach(item => {
        if (item.isPercentage && item.percentValue) {
            additionalCost += (baseTotal.totalCost * item.percentValue) / 100;
            additionalCharge += (baseTotal.totalCharge * item.percentValue) / 100;
        }
    });

    return {
        totalCost: baseTotal.totalCost + additionalCost,
        totalCharge: baseTotal.totalCharge + additionalCharge,
    };
}

// Count total items in quote
export function countItems(sections) {
    if (!sections || typeof sections !== 'object') return 0;

    let count = 0;

    Object.values(sections).forEach(section => {
        if (section?.subsections) {
            Object.values(section.subsections).forEach(items => {
                if (Array.isArray(items)) {
                    count += items.length;
                }
            });
        }
    });

    return count;
}
