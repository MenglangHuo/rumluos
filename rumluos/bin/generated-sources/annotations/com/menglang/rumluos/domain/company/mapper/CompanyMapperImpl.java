package com.menglang.rumluos.domain.company.mapper;

import com.menglang.rumluos.domain.company.dto.CompanyDto;
import com.menglang.rumluos.domain.company.entity.Company;
import java.time.Instant;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-09-24T21:09:02+0700",
    comments = "version: 1.6.3, compiler: Eclipse JDT (IDE) 3.46.100.v20260826-1225, environment: Java 21.0.12.1 (Eclipse Adoptium)"
)
@Component
public class CompanyMapperImpl implements CompanyMapper {

    @Override
    public Company toEntity(CompanyDto.CreateCompanyRequest request) {
        if ( request == null ) {
            return null;
        }

        Company company = new Company();

        company.setAddress( request.address() );
        company.setDescription( request.description() );
        company.setEmail( request.email() );
        if ( request.enableBranch() != null ) {
            company.setEnableBranch( request.enableBranch() );
        }
        company.setName( request.name() );
        company.setPhone( request.phone() );

        company.setActive( true );

        return company;
    }

    @Override
    public CompanyDto.CompanyResponse toResponse(Company company) {
        if ( company == null ) {
            return null;
        }

        Long id = null;
        String name = null;
        String email = null;
        String phone = null;
        String address = null;
        String description = null;
        boolean enableBranch = false;
        Instant createdAt = null;
        Instant updatedAt = null;

        id = company.getId();
        name = company.getName();
        email = company.getEmail();
        phone = company.getPhone();
        address = company.getAddress();
        description = company.getDescription();
        enableBranch = company.isEnableBranch();
        createdAt = company.getCreatedAt();
        updatedAt = company.getUpdatedAt();

        boolean isActive = false;

        CompanyDto.CompanyResponse companyResponse = new CompanyDto.CompanyResponse( id, name, email, phone, address, description, isActive, enableBranch, createdAt, updatedAt );

        return companyResponse;
    }

    @Override
    public CompanyDto.CompanySummaryResponse toSummary(Company company) {
        if ( company == null ) {
            return null;
        }

        Long id = null;
        String name = null;

        id = company.getId();
        name = company.getName();

        boolean isActive = false;

        CompanyDto.CompanySummaryResponse companySummaryResponse = new CompanyDto.CompanySummaryResponse( id, name, isActive );

        return companySummaryResponse;
    }

    @Override
    public void updateEntity(CompanyDto.UpdateCompanyRequest request, Company company) {
        if ( request == null ) {
            return;
        }

        if ( request.address() != null ) {
            company.setAddress( request.address() );
        }
        if ( request.description() != null ) {
            company.setDescription( request.description() );
        }
        if ( request.email() != null ) {
            company.setEmail( request.email() );
        }
        if ( request.enableBranch() != null ) {
            company.setEnableBranch( request.enableBranch() );
        }
        if ( request.name() != null ) {
            company.setName( request.name() );
        }
        if ( request.phone() != null ) {
            company.setPhone( request.phone() );
        }
    }
}
