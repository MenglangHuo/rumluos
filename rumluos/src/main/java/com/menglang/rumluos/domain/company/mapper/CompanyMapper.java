package com.menglang.rumluos.domain.company.mapper;
import com.menglang.rumluos.domain.company.dto.CompanyDto;
import com.menglang.rumluos.domain.company.entity.Company;
import org.mapstruct.*;


@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        builder = @Builder(disableBuilder = true)
)
public interface CompanyMapper {

    @Mapping(target = "id",        ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "active",  constant = "true")
    Company toEntity(CompanyDto.CreateCompanyRequest request);

    CompanyDto.CompanyResponse toResponse(Company company);

    CompanyDto.CompanySummaryResponse toSummary(Company company);

    /**
     * Patch-update: only non-null fields from the request are applied.
     * MapStruct respects {@code NullValuePropertyMappingStrategy.IGNORE} here.
     */
    @Mapping(target = "id",        ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    void updateEntity(CompanyDto.UpdateCompanyRequest request, @MappingTarget Company company);
}
