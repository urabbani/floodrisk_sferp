#!/usr/bin/env python3
"""
Generate EAD % Change Graph - Present Climate
Perfect vs Reduced Capacity
"""

import matplotlib.pyplot as plt
import numpy as np

# Data from the EAD calculation
districts = ['Dadu', 'Jacobabad', 'Jamshoro', 'Kashmore', 'Larkana', 'Qambar Shahdadkot', 'Shikarpur']

# EAD Total values (PKR Million) - Present Climate
perfect_ead = [470.7, 83.8, 166.2, 11.2, 12.5, 250.1, 14.0]
redcap_ead = [471.0, 83.8, 166.9, 11.2, 12.5, 250.7, 14.0]

# Calculate percentage change
pct_changes = [(r - p) / p * 100 for p, r in zip(perfect_ead, redcap_ead)]

# Colors for positive/negative changes
colors = ['#ef4444' if x > 0 else '#22c55e' for x in pct_changes]

# Create figure
fig, ax = plt.subplots(figsize=(12, 6))

# Create bar chart
bars = ax.barh(districts, pct_changes, color=colors, alpha=0.8, edgecolor='black', linewidth=0.8)

# Add value labels on bars
for i, (bar, val) in enumerate(zip(bars, pct_changes)):
    offset = 0.01 if val > 0 else -0.01
    ax.text(val + offset, i, f'{val:+.2f}%',
            va='center', ha='left' if val > 0 else 'right',
            fontsize=10, fontweight='bold')

# Styling
ax.set_xlabel('EAD % Change (Reduced Capacity - Perfect)', fontsize=12, fontweight='bold')
ax.set_title('EAD Change: Reduced Capacity vs Perfect Maintenance\nPresent Climate - All Districts',
             fontsize=14, fontweight='bold', pad=20)
ax.axvline(x=0, color='black', linestyle='-', linewidth=0.8)
ax.grid(axis='x', alpha=0.3, linestyle='--')

# Legend
from matplotlib.patches import Patch
legend_elements = [
    Patch(facecolor='#ef4444', label='Increase in EAD'),
    Patch(facecolor='#22c55e', label='Decrease in EAD')
]
ax.legend(handles=legend_elements, loc='lower right')

# Add summary text
avg_change = np.mean(pct_changes)
ax.text(0.98, 0.95, f'Average: {avg_change:+.3f}%',
        transform=ax.transAxes, ha='right', va='top',
        bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5),
        fontsize=11, fontweight='bold')

plt.tight_layout()
plt.savefig('/mnt/d/floodrisk_sferp/ead_percent_change_present.png', dpi=300, bbox_inches='tight')
print("Graph saved: ead_percent_change_present.png")
