// ListPageLayout.js
const ListPageLayout = ({ title, buttonText, onButtonClick, filterDefs, filters, onFilterChange, children }) => {
    return (
        <Container maxWidth="xl">
            <Paper sx={{ p: 3, my: 4 }}>
                <PageHeader title={title} buttonText={buttonText} onButtonClick={onButtonClick} />
                <FilterBar filterDefinitions={filterDefs} filters={filters} onFilterChange={onFilterChange} />
                {children} {/* Aquí se renderizará el DataGrid */}
            </Paper>
        </Container>
    );
}