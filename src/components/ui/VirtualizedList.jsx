import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useRef, useCallback, useEffect, forwardRef } from 'react';

/**
 * VirtualizedList - A reusable virtualized list component for large datasets
 *
 * @param {Object} props
 * @param {Array} props.items - Array of items to render
 * @param {Function} props.renderItem - Function to render each item: (item, index, style) => ReactNode
 * @param {number} props.itemHeight - Height of each item in pixels
 * @param {string} [props.className] - Additional class names for the container
 * @param {number} [props.overscanCount=5] - Number of items to render outside visible area
 * @param {string} [props.emptyMessage] - Message to show when list is empty
 * @param {Function} [props.onItemsRendered] - Callback when items are rendered
 * @param {number} [props.threshold=50] - Minimum items before virtualization kicks in
 */
export function VirtualizedList({
    items,
    renderItem,
    itemHeight,
    className = '',
    overscanCount = 5,
    emptyMessage = 'No items',
    onItemsRendered,
    threshold = 50,
}) {
    const listRef = useRef(null);

    // For small lists, render normally without virtualization
    if (items.length < threshold) {
        return (
            <div className={className}>
                {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">{emptyMessage}</div>
                ) : (
                    items.map((item, index) => (
                        <div key={item.id || index} style={{ height: itemHeight }}>
                            {renderItem(item, index, {})}
                        </div>
                    ))
                )}
            </div>
        );
    }

    // Row renderer for virtualized list
    const Row = ({ index, style }) => {
        const item = items[index];
        return renderItem(item, index, style);
    };

    return (
        <div className={className} style={{ height: '100%', minHeight: 400 }}>
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        ref={listRef}
                        height={height}
                        width={width}
                        itemCount={items.length}
                        itemSize={itemHeight}
                        overscanCount={overscanCount}
                        onItemsRendered={onItemsRendered}
                    >
                        {Row}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
}

/**
 * VirtualizedGrid - For grid layouts with virtualization
 *
 * @param {Object} props
 * @param {Array} props.items - Array of items to render
 * @param {Function} props.renderItem - Function to render each item
 * @param {number} props.itemHeight - Height of each row
 * @param {number} props.columnCount - Number of columns
 * @param {string} [props.className] - Additional class names
 * @param {number} [props.gap=16] - Gap between items in pixels
 */
export function VirtualizedGrid({
    items,
    renderItem,
    itemHeight,
    columnCount,
    className = '',
    gap = 16,
    threshold = 50,
}) {
    // Calculate rows
    const rowCount = Math.ceil(items.length / columnCount);

    // For small lists, render normally
    if (items.length < threshold) {
        return (
            <div
                className={className}
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                    gap: gap,
                }}
            >
                {items.map((item, index) => (
                    <div key={item.id || index}>
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
        );
    }

    // Row renderer for grid
    const Row = ({ index, style }) => {
        const startIdx = index * columnCount;
        const rowItems = items.slice(startIdx, startIdx + columnCount);

        return (
            <div
                style={{
                    ...style,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                    gap: gap,
                    paddingBottom: gap,
                }}
            >
                {rowItems.map((item, colIndex) => (
                    <div key={item.id || startIdx + colIndex}>
                        {renderItem(item, startIdx + colIndex)}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className={className} style={{ height: '100%', minHeight: 400 }}>
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        height={height}
                        width={width}
                        itemCount={rowCount}
                        itemSize={itemHeight + gap}
                    >
                        {Row}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
}

/**
 * useVirtualScroll - Hook for custom virtualization needs
 *
 * @param {Object} options
 * @param {number} options.itemCount - Total number of items
 * @param {number} options.itemHeight - Height of each item
 * @param {number} options.containerHeight - Height of visible area
 * @param {number} [options.overscan=3] - Extra items to render
 */
export function useVirtualScroll({
    itemCount,
    itemHeight,
    containerHeight,
    overscan = 3,
}) {
    const scrollRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);

    const handleScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, []);

    // Calculate visible range
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
        itemCount - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
        visibleItems.push({
            index: i,
            style: {
                position: 'absolute',
                top: i * itemHeight,
                height: itemHeight,
                width: '100%',
            },
        });
    }

    const totalHeight = itemCount * itemHeight;

    return {
        scrollRef,
        handleScroll,
        visibleItems,
        totalHeight,
        startIndex,
        endIndex,
    };
}

// Need to import useState for the hook
import { useState } from 'react';

export default VirtualizedList;
